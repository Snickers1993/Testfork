import { describe, expect, it } from "vitest";
import {
  initialMoonveilState,
  parseMoonveilState,
  upsertConversationAssociation,
} from "./model";

describe("Moonveil guild model", () => {
  it("seeds five persistent companion identities", () => {
    const state = initialMoonveilState();
    expect(state.companions.map((entry) => entry.name)).toEqual([
      "Elaria",
      "Sylra",
      "Lyra",
      "Rowan",
      "Noctis",
    ]);
  });

  it("persists a companion project and native thread association", () => {
    const state = upsertConversationAssociation(
      initialMoonveilState(),
      "companion-sylra",
      "workspace-1",
      "C:/Projects/Moonveil",
      "thread-native-1",
    );
    const restored = parseMoonveilState(JSON.stringify(state));
    expect(restored.projects).toHaveLength(1);
    expect(restored.conversations[0]).toMatchObject({
      companionId: "companion-sylra",
      workspaceId: "workspace-1",
      threadId: "thread-native-1",
    });
  });
});

describe("Moonveil persisted data validation", () => {
  it("retains editable companion identity and preferences without unknown fields", () => {
    const state = initialMoonveilState();
    state.companions[1] = { ...state.companions[1], name: "Sylra II", role: "Reviewer", portrait: "noctis", instructions: "Check assumptions first.", detail: "concise" };
    const restored = parseMoonveilState(JSON.stringify({ ...state, token: "not-product-data", companions: state.companions.map((entry) => ({ ...entry, token: "not-product-data" })) }));
    expect(restored.companions[1]).toEqual(state.companions[1]);
    expect(restored).not.toHaveProperty("token");
    expect(restored.companions[1]).not.toHaveProperty("token");
  });

  it("drops malformed and orphaned associations and defaults invalid presentation fields", () => {
    const state = initialMoonveilState();
    const valid = { companionId: "companion-sylra", workspaceId: "ws-1", workspacePath: "C:/Project", threadId: "native-1" };
    const restored = parseMoonveilState(JSON.stringify({ ...state, theme: "invalid", selectedCompanionId: "missing", projects: [null, valid, { ...valid, companionId: "missing" }], conversations: [null, valid, { ...valid, threadId: 12 }] }));
    expect(restored.projects).toEqual([{ companionId: "companion-sylra", workspaceId: "ws-1", workspacePath: "C:/Project" }]);
    expect(restored.conversations).toEqual([valid]);
    expect(restored.theme).toBe("dark");
    expect(restored.companions.some((entry) => entry.id === restored.selectedCompanionId)).toBe(true);
  });

  it("keeps multiple native conversations and deduplicates an existing link", () => {
    let state = upsertConversationAssociation(initialMoonveilState(), "companion-sylra", "ws-1", "C:/Project", "native-1");
    state = upsertConversationAssociation(state, "companion-sylra", "ws-1", "C:/Project", "native-2");
    state = upsertConversationAssociation(state, "companion-sylra", "ws-1", "C:/Project", "native-1");
    expect(state.projects).toHaveLength(1);
    expect(state.conversations).toHaveLength(2);
    expect(parseMoonveilState(JSON.stringify(state)).conversations).toEqual(state.conversations);
  });

  it.each(["invalid json", "null", '{"schemaVersion":2}', '{"schemaVersion":1,"companions":[null]}'])("restores a usable Guild Hall from malformed data: %s", (raw) => {
    expect(parseMoonveilState(raw).companions).toHaveLength(5);
  });
});
