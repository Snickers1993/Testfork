import { describe, expect, it } from "vitest";
import { CompletedTurnTracker } from "./completedTurnTracker";
const event = (method: string, params: Record<string, unknown>, session = "session") => ({
  workspace_id: "workspace", message: { method, params, moonveilSessionId: session },
});

describe("completed native turn tracking", () => {
  it("recognizes delayed output after interruption while keeping later turns active", () => {
    const tracker = new CompletedTurnTracker();
    const item = { threadId: "thread", turnId: "interrupted", itemId: "shell" };
    expect(tracker.observe(event("item/commandExecution/outputDelta", item))).toBe(false);
    tracker.observe(event("turn/completed", { threadId: "thread", turn: { id: "interrupted", status: "interrupted" } }));
    expect(tracker.observe(event("item/commandExecution/outputDelta", item))).toBe(true);
    // Some older notifications omit turnId; the native item association still identifies it.
    expect(tracker.observe(event("item/commandExecution/outputDelta", { threadId: "thread", itemId: "shell" }))).toBe(true);
    expect(tracker.observe(event("item/started", { threadId: "thread", turnId: "next", item: { id: "next-shell" } }))).toBe(false);
    expect(tracker.observe(event("item/commandExecution/outputDelta", item, "reconnected"))).toBe(false);
  });

  it("treats terminal errors as final while preserving retries", () => {
    const tracker = new CompletedTurnTracker();
    const params = { threadId: "thread", turnId: "turn", itemId: "shell" };
    tracker.observe(event("error", { ...params, willRetry: true }));
    expect(tracker.observe(event("item/started", params))).toBe(false);
    tracker.observe(event("error", { ...params, willRetry: false }));
    expect(tracker.observe(event("item/started", params))).toBe(true);
    expect(tracker.observe(event("item/started", { ...params, threadId: "other" }))).toBe(false);
  });
});
