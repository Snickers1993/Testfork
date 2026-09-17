// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GuildHall } from "./GuildHall";
import { initialMoonveilState, MOONVEIL_STORAGE_KEY, parseMoonveilState, upsertConversationAssociation } from "./model";
import type { MoonveilGuildProps } from "./types";

const workspace = { id: "ws-1", name: "Moonveil", path: "C:/Projects/Moonveil", connected: true, settings: { sidebarCollapsed: false } };
function props(overrides: Partial<MoonveilGuildProps> = {}): MoonveilGuildProps {
  return { workspaces: [workspace], threadsByWorkspace: {}, activeWorkspaceId: null, activeThreadId: null,
    onAddWorkspace: vi.fn(), onCreateThread: vi.fn().mockResolvedValue("native-sylra"), onOpenThread: vi.fn(), ...overrides };
}
function savedState() { return parseMoonveilState(window.localStorage.getItem(MOONVEIL_STORAGE_KEY)); }

beforeEach(() => window.localStorage.clear());
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("Guild Hall continuity", () => {
  it("saves the companion association before navigation unmounts the Guild Hall", async () => {
    const onOpenThread = vi.fn(() => {
      expect(savedState().conversations).toEqual([{ companionId: "companion-sylra", workspaceId: "ws-1", workspacePath: workspace.path, threadId: "native-sylra" }]);
      view.unmount();
    });
    const options = props({ onOpenThread });
    const view = render(<GuildHall {...options} />);
    fireEvent.click(screen.getByRole("button", { name: "New conversation with Sylra" }));
    await waitFor(() => expect(onOpenThread).toHaveBeenCalledWith("ws-1", "native-sylra"));
    expect(options.onCreateThread).toHaveBeenCalledWith("ws-1", expect.objectContaining({ id: "companion-sylra", instructions: initialMoonveilState().companions[1].instructions }));
    const reopened = props();
    render(<GuildHall {...reopened} />);
    fireEvent.click(screen.getByRole("button", { name: /native-sylra/ }));
    expect(reopened.onOpenThread).toHaveBeenCalledWith("ws-1", "native-sylra");
    expect(reopened.onCreateThread).not.toHaveBeenCalled();
  });

  it("allows selecting another companion while a linked native thread remains active", () => {
    const state = upsertConversationAssociation(initialMoonveilState(), "companion-sylra", "ws-1", workspace.path, "native-sylra");
    window.localStorage.setItem(MOONVEIL_STORAGE_KEY, JSON.stringify(state));
    render(<GuildHall {...props({ activeWorkspaceId: "ws-1", activeThreadId: "native-sylra" })} />);
    fireEvent.click(screen.getByRole("button", { name: /Elaria, Arcane Scholar/ }));
    expect(screen.getByRole("heading", { name: "Elaria" })).toBeTruthy();
    expect(savedState().selectedCompanionId).toBe("companion-elaria");
  });

  it("keeps current metadata when companion selection changes during creation", async () => {
    let resolve!: (threadId: string) => void;
    const options = props({ onCreateThread: vi.fn(() => new Promise<string>((done) => { resolve = done; })) });
    render(<GuildHall {...options} />);
    fireEvent.click(screen.getByRole("button", { name: "New conversation with Sylra" }));
    fireEvent.click(screen.getByRole("button", { name: /Elaria, Arcane Scholar/ }));
    await act(async () => resolve("native-sylra"));
    expect(savedState().selectedCompanionId).toBe("companion-elaria");
    expect(savedState().conversations[0].companionId).toBe("companion-sylra");
  });

  it("preserves a completed association if the screen was closed while starting", async () => {
    let resolve!: (threadId: string) => void;
    const options = props({ onCreateThread: vi.fn(() => new Promise<string>((done) => { resolve = done; })) });
    const view = render(<GuildHall {...options} />);
    fireEvent.click(screen.getByRole("button", { name: "New conversation with Sylra" }));
    view.unmount();
    await act(async () => resolve("native-sylra"));
    expect(savedState().conversations[0].threadId).toBe("native-sylra");
    expect(options.onOpenThread).not.toHaveBeenCalled();
  });

  it.each([null, "error"])("does not save or navigate after native creation failure: %s", async (failure) => {
    const options = props({ onCreateThread: failure === "error" ? vi.fn().mockRejectedValue(new Error("Codex unavailable")) : vi.fn().mockResolvedValue(null) });
    render(<GuildHall {...options} />);
    fireEvent.click(screen.getByRole("button", { name: "New conversation with Sylra" }));
    await screen.findByRole("alert");
    expect(savedState().conversations).toEqual([]);
    expect(options.onOpenThread).not.toHaveBeenCalled();
    expect(options.onCreateThread).toHaveBeenCalledTimes(1);
  });

  it("does not create native state when guild storage is unavailable", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Storage full"); });
    const options = props();
    render(<GuildHall {...options} />);
    fireEvent.click(screen.getByRole("button", { name: "New conversation with Sylra" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Storage full");
    expect(options.onCreateThread).not.toHaveBeenCalled();
  });

  it("reports a real created thread without retrying when saving its association fails", async () => {
    const setItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
      if (JSON.parse(value).conversations.length) throw new Error("Storage full");
      return setItem.call(this, key, value);
    });
    const options = props();
    render(<GuildHall {...options} />);
    fireEvent.click(screen.getByRole("button", { name: "New conversation with Sylra" }));
    expect((await screen.findByRole("alert")).textContent).toContain("native-sylra was created");
    expect(options.onCreateThread).toHaveBeenCalledTimes(1);
    expect(options.onOpenThread).not.toHaveBeenCalled();
  });

  it("links existing native threads without applying new instructions", () => {
    const options = props({ threadsByWorkspace: { "ws-1": [{ id: "existing-native", name: "Existing conversation", updatedAt: 1 }] } });
    render(<GuildHall {...options} />);
    fireEvent.change(screen.getByLabelText("Or link an existing native Codex thread"), { target: { value: "existing-native" } });
    expect(savedState().conversations[0].threadId).toBe("existing-native");
    expect(options.onCreateThread).not.toHaveBeenCalled();
  });

  it("restores custom companion identity, project, and exact native thread on restart", () => {
    const state = initialMoonveilState();
    state.companions.push({ id: "custom", name: "Mira", role: "Reviewer", instructions: "Review carefully.", portrait: "noctis", detail: "concise" });
    state.selectedCompanionId = "custom";
    window.localStorage.setItem(MOONVEIL_STORAGE_KEY, JSON.stringify(upsertConversationAssociation(state, "custom", "ws-1", workspace.path, "old-native")));
    const options = props();
    render(<GuildHall {...options} />);
    expect(screen.getByRole("heading", { name: "Mira" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /old-native/ }));
    expect(options.onOpenThread).toHaveBeenCalledWith("ws-1", "old-native");
    expect(options.onCreateThread).not.toHaveBeenCalled();
  });
});
