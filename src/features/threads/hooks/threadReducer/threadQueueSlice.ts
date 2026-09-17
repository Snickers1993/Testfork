import type { ThreadAction, ThreadState } from "../useThreadsReducer";

export function reduceThreadQueue(state: ThreadState, action: ThreadAction): ThreadState {
  switch (action.type) {
    case "clearServerRequests": {
      const matches = (workspaceId: string, requestId: string | number, threadId: unknown, turnId: unknown, sessionId?: string) =>
        workspaceId === action.workspaceId &&
        (action.sessionId === undefined || action.sessionId === sessionId) &&
        (action.requestId === undefined || action.requestId === requestId) &&
        (action.threadId === undefined || action.threadId === threadId) &&
        (action.turnId === undefined || action.turnId === turnId);
      return { ...state,
        approvals: state.approvals.filter((request) => !matches(request.workspace_id, request.request_id,
          request.params.threadId ?? request.params.thread_id ?? request.params.conversationId,
          request.params.turnId ?? request.params.turn_id ??
            (["execCommandApproval", "applyPatchApproval"].includes(request.method) ? action.turnId : undefined), request.session_id)),
        userInputRequests: state.userInputRequests.filter((request) => !matches(request.workspace_id, request.request_id,
          request.params.thread_id, request.params.turn_id, request.session_id)),
      };
    }
    case "addApproval": {
      const exists = state.approvals.some(
        (item) =>
          item.request_id === action.approval.request_id &&
          item.request_token === action.approval.request_token &&
          item.workspace_id === action.approval.workspace_id,
      );
      if (exists) {
        return state;
      }
      return { ...state, approvals: [...state.approvals, action.approval] };
    }
    case "removeApproval":
      return {
        ...state,
        approvals: state.approvals.filter(
          (item) =>
            item.request_id !== action.requestId ||
            item.workspace_id !== action.workspaceId,
        ),
      };
    case "addUserInputRequest": {
      const exists = state.userInputRequests.some(
        (item) =>
          item.request_id === action.request.request_id &&
          item.request_token === action.request.request_token &&
          item.workspace_id === action.request.workspace_id,
      );
      if (exists) {
        return state;
      }
      return {
        ...state,
        userInputRequests: [...state.userInputRequests, action.request],
      };
    }
    case "removeUserInputRequest":
      return {
        ...state,
        userInputRequests: state.userInputRequests.filter(
          (item) =>
            item.request_id !== action.requestId ||
            item.workspace_id !== action.workspaceId ||
            (action.sessionId !== undefined && action.sessionId !== item.session_id),
        ),
      };
    default:
      return state;
  }
}
