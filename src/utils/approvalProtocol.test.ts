import { describe, expect, it } from "vitest";
import { approvalChoices, approvalRequestKey } from "./approvalProtocol";
import { initialState, threadReducer } from "@threads/hooks/useThreadsReducer";
import type { ApprovalRequest } from "@/types";
const request = (method: string, params: Record<string, unknown> = {}, request_id: string | number = 0): ApprovalRequest => ({ workspace_id: "w", request_id, method, params });
describe("current Codex approval protocol", () => {
  it("preserves typed IDs and honors offered decisions without persistent grants", () => {
    expect(approvalRequestKey(request("x", {}, "0"))).not.toBe(approvalRequestKey(request("x", {}, 0)));
    expect(approvalChoices(request("item/commandExecution/requestApproval", { availableDecisions: ["cancel", "acceptForSession", { acceptWithExecpolicyAmendment: { execpolicy_amendment: ["cmd"] } }] })))
      .toEqual([{ label: "Cancel turn", result: { decision: "cancel" } }]);
  });
  it("grants only requested permissions for one turn and denies with empty grants", () => {
    expect(approvalChoices(request("item/permissions/requestApproval", { permissions: { network: { enabled: true }, fileSystem: null } })).map(c => c.result))
      .toEqual([{ permissions: { network: { enabled: true } }, scope: "turn" }, { permissions: {}, scope: "turn" }]);
  });
  it("uses exact legacy and MCP contracts and never accepts unknown requests", () => {
    expect(approvalChoices(request("execCommandApproval"))[0].result).toEqual({ decision: "approved" });
    expect(approvalChoices(request("mcpServer/elicitation/request"))[0].result).toEqual({ action: "decline", content: null, _meta: null });
    expect(approvalChoices(request("future/security/request"))).toEqual([{ label: "Reject unsupported request", result: { _moonveilUnsupported: true } }]);
  });
  it("clears only the resolved ID, matching turn, or disconnected workspace", () => {
    const a = request("item/fileChange/requestApproval", { threadId: "t", turnId: "a" }, 1);
    const b = request("item/fileChange/requestApproval", { threadId: "t", turnId: "b" }, "1");
    const c = { ...a, workspace_id: "other" };
    const state = { ...initialState, approvals: [a, b, c] };
    expect(threadReducer(state, { type: "clearServerRequests", workspaceId: "w", requestId: 1 }).approvals).toEqual([b, c]);
    expect(threadReducer(state, { type: "clearServerRequests", workspaceId: "w", threadId: "t", turnId: "a" }).approvals).toEqual([b, c]);
    expect(threadReducer(state, { type: "clearServerRequests", workspaceId: "w" }).approvals).toEqual([c]);
  });
});

it("does not let an old session disconnect clear a new approval using the same native ID", () => {
  const old = { ...request("item/fileChange/requestApproval"), session_id: "old", request_token: "old:r" };
  const next = { ...old, session_id: "new", request_token: "new:r" };
  const state = threadReducer({ ...initialState, approvals: [old] }, { type: "addApproval", approval: next });
  expect(state.approvals).toEqual([old, next]);
  expect(threadReducer(state, { type: "clearServerRequests", workspaceId: "w", sessionId: "old" }).approvals).toEqual([next]);
});

it("clears legacy approvals on turn completion while retaining uncorrelated MCP elicitations", () => {
  const legacy = request("execCommandApproval", { conversationId: "t" });
  const elicitation = request("mcpServer/elicitation/request", { threadId: "t", turnId: null }, 2);
  expect(threadReducer({ ...initialState, approvals: [legacy, elicitation] }, {
    type: "clearServerRequests", workspaceId: "w", threadId: "t", turnId: "done",
  }).approvals).toEqual([elicitation]);
});
