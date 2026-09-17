import { useCallback } from "react";
import type { Dispatch, MutableRefObject } from "react";
import type { ApprovalRequest } from "@/types";
import type { ThreadAction } from "./useThreadsReducer";

type UseThreadApprovalEventsOptions = {
  dispatch: Dispatch<ThreadAction>;
  approvalAllowlistRef: MutableRefObject<Record<string, string[][]>>;
};

export function useThreadApprovalEvents({
  dispatch,
  approvalAllowlistRef: _approvalAllowlistRef,
}: UseThreadApprovalEventsOptions) {
  return useCallback(
    (approval: ApprovalRequest) => {
      // Moonveil never synthesizes or auto-accepts a Codex approval request.
      // The native request remains pending until the user makes an explicit decision.
      dispatch({ type: "addApproval", approval });
    },
    [dispatch],
  );
}
