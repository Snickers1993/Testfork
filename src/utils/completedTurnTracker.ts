import type { AppServerEvent } from "@/types";

/** Remember terminal turns so delayed tool output cannot reopen an interrupted turn. */
export class CompletedTurnTracker {
  private readonly completed = new Set<string>();
  private readonly itemTurns = new Map<string, string>();

  observe(event: AppServerEvent): boolean {
    const { message, workspace_id } = event;
    const params = message.params as Record<string, unknown> | undefined;
    if (!params || typeof params !== "object") return false;
    const turn = params.turn as Record<string, unknown> | undefined;
    const threadId = params.threadId ?? params.thread_id ?? turn?.threadId ?? turn?.thread_id;
    if (typeof threadId !== "string") return false;
    const scope = [message.moonveilSessionId ?? "", workspace_id, threadId];
    const turnId = turn?.id ?? params.turnId ?? params.turn_id;
    const turnKey = typeof turnId === "string" && turnId ? JSON.stringify([...scope, turnId]) : undefined;
    const item = params.item as Record<string, unknown> | undefined;
    const itemId = params.itemId ?? params.item_id ?? item?.id;
    const itemKey = typeof itemId === "string" ? JSON.stringify([...scope, itemId]) : undefined;
    if (turnKey && itemKey) this.itemTurns.set(itemKey, turnKey);
    const terminal = message.method === "turn/completed" ||
      (message.method === "error" && !(params.willRetry ?? params.will_retry));
    if (terminal && turnKey) this.completed.add(turnKey);
    const knownTurn = turnKey ?? (itemKey ? this.itemTurns.get(itemKey) : undefined);
    return knownTurn !== undefined && this.completed.has(knownTurn);
  }
}
