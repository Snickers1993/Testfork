// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ApprovalRequest } from "@/types";
import { useThreadApprovalEvents } from "./useThreadApprovalEvents";

describe("useThreadApprovalEvents", () => {
  it("never auto-accepts a real approval request, even with an old local allowlist", () => {
    const dispatch = vi.fn();
    const approvalAllowlistRef = { current: { "ws-1": [["git", "status"]] } };
    const approval: ApprovalRequest = {
      workspace_id: "ws-1",
      request_id: 42,
      method: "approval/request",
      params: { argv: ["git", "status"] },
    };
    const { result } = renderHook(() => useThreadApprovalEvents({ dispatch, approvalAllowlistRef }));
    act(() => result.current(approval));
    expect(dispatch).toHaveBeenCalledWith({ type: "addApproval", approval });
  });
});
