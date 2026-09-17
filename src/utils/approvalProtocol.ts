import type { ApprovalRequest } from "@/types";

/** Results from Codex 0.154.0-alpha.6.2 generated app-server schemas. */
export type ApprovalResponse = Record<string, unknown>;
export type ApprovalChoice = { label: string; result: ApprovalResponse };

export function approvalRequestKey(request: Pick<ApprovalRequest, "workspace_id" | "request_id" | "request_token">) {
  return JSON.stringify([request.workspace_id, request.request_id, request.request_token]);
}

export function approvalChoices(request: ApprovalRequest): ApprovalChoice[] {
  const { method, params } = request;
  if (method === "item/commandExecution/requestApproval" || method === "item/fileChange/requestApproval") {
    const offered = method === "item/commandExecution/requestApproval" && Array.isArray(params.availableDecisions)
      ? params.availableDecisions : ["accept", "decline", "cancel"];
    // Persistent policy amendments and session-wide execution grants are deliberately
    // not exposed. Only decisions actually offered by Codex may be returned.
    const labels: Record<string, string> = { accept: "Approve once", decline: "Decline", cancel: "Cancel turn" };
    return offered.filter((value): value is string => typeof value === "string" && value in labels)
      .map((decision) => ({ label: labels[decision], result: { decision } }));
  }
  if (method === "execCommandApproval" || method === "applyPatchApproval") {
    return [
      { label: "Approve once", result: { decision: "approved" } },
      { label: "Decline", result: { decision: { denied: { rejection: "Declined by the user in Moonveil." } } } },
      { label: "Cancel turn", result: { decision: "abort" } },
    ];
  }
  if (method === "item/permissions/requestApproval") {
    const requested = params.permissions;
    const permissions = requested && typeof requested === "object" && !Array.isArray(requested)
      ? Object.fromEntries(Object.entries(requested).filter(([key, value]) => ["network", "fileSystem"].includes(key) && value !== null)) : null;
    return [
      ...(permissions ? [{ label: "Allow for this turn", result: { permissions, scope: "turn" } }] : []),
      { label: "Decline", result: { permissions: {}, scope: "turn" } },
    ];
  }
  if (method === "mcpServer/elicitation/request") {
    // Form, URL, and user-verification acceptance require specialized host UX.
    // Keep these genuine requests visible and let the user decline or cancel.
    return ["decline", "cancel"].map((action) => ({
      label: action === "decline" ? "Decline" : "Cancel request",
      result: { action, content: null, _meta: null },
    }));
  }
  if (method === "item/tool/call") {
    return [{ label: "Reject unsupported tool", result: {
      success: false, contentItems: [{ type: "inputText", text: "Moonveil does not register or execute dynamic tools." }],
    } }];
  }
  return [{ label: "Reject unsupported request", result: { _moonveilUnsupported: true } }];
}

export function approvalNotice(request: ApprovalRequest): string | null {
  if (request.method === "mcpServer/elicitation/request") {
    return "This MCP request requires form, browser, or verification support that Moonveil does not yet provide. You can decline or cancel it.";
  }
  if (request.method === "item/permissions/requestApproval") {
    return "Allow grants the displayed permissions only for the current turn.";
  }
  if (request.method === "item/commandExecution/requestApproval") {
    return "Only one-time decisions are offered here. Persistent policy changes are unavailable.";
  }
  if (!["item/fileChange/requestApproval", "execCommandApproval", "applyPatchApproval"].includes(request.method)) {
    return "This request is unsupported. It remains pending until you reject it or stop the turn. Moonveil will not execute it.";
  }
  return null;
}
