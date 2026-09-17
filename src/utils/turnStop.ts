/** Stop success must include the backend's native interrupt and terminal-cleanup confirmation. */
export function requireNativeStopConfirmation(response: unknown): void {
  if (!response || typeof response !== "object") throw new Error("Codex did not confirm stop");
  const record = response as Record<string, unknown>;
  if (record.error && typeof record.error === "object") {
    const error = record.error as Record<string, unknown>;
    throw new Error(typeof error.message === "string" ? error.message : "Codex rejected stop");
  }
  const result = record.result as Record<string, unknown> | undefined;
  if (result?.interrupted !== true || typeof result.processesStopped !== "number") {
    throw new Error("Codex did not confirm the turn and its processes stopped");
  }
}
