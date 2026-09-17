import { useCallback, useRef } from "react";
import type { Dispatch } from "react";
import type { ApprovalRequest, DebugEntry } from "@/types";
import { approvalChoices, approvalRequestKey } from "@utils/approvalProtocol";
import type { ApprovalResponse } from "@utils/approvalProtocol";
import { respondToServerRequest } from "@services/tauri";
import type { ThreadAction } from "./useThreadsReducer";

type UseThreadApprovalsOptions = { dispatch: Dispatch<ThreadAction>; onDebug?: (entry: DebugEntry) => void };
export function useThreadApprovals({ dispatch }: UseThreadApprovalsOptions) {
  // Compatibility seam for existing wiring; never populated or consulted.
  const approvalAllowlistRef = useRef<Record<string, string[][]>>({});
  const pending = useRef(new Set<string>());
  const handleApprovalDecision = useCallback(async (request: ApprovalRequest, response: ApprovalResponse) => {
    if (!approvalChoices(request).some((choice) => JSON.stringify(choice.result) === JSON.stringify(response))) {
      throw new Error("This response is not offered for the Codex request.");
    }
    const key = approvalRequestKey(request);
    if (pending.current.has(key)) return;
    pending.current.add(key);
    try {
      await respondToServerRequest(request.workspace_id, request.request_id, response, request.request_token);
      dispatch({ type: "clearServerRequests", requestId: request.request_id, workspaceId: request.workspace_id, sessionId: request.session_id });
    } finally { pending.current.delete(key); }
  }, [dispatch]);
  const handleApprovalRemember = useCallback(async () => {
    throw new Error("Persistent approval rules are unavailable in Moonveil.");
  }, []);
  return { approvalAllowlistRef, handleApprovalDecision, handleApprovalRemember };
}
