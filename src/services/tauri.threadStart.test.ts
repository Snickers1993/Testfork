import { beforeEach, describe, expect, it, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { resumeThread, startThread } from "./tauri";
vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

describe("native companion instruction IPC", () => {
  beforeEach(() => vi.clearAllMocks());
  it("sends developerInstructions only with companion thread creation", async () => {
    await startThread("ws-1", "You are Sylra.\nBe practical.");
    expect(invoke).toHaveBeenCalledWith("start_thread", { workspaceId: "ws-1", developerInstructions: "You are Sylra.\nBe practical." });
  });
  it("preserves ordinary start and exact native resume payloads", async () => {
    await startThread("ws-1");
    expect(invoke).toHaveBeenCalledWith("start_thread", { workspaceId: "ws-1" });
    await resumeThread("ws-1", "native-sylra");
    expect(invoke).toHaveBeenCalledWith("resume_thread", { workspaceId: "ws-1", threadId: "native-sylra" });
  });
});
