import { useMemo, useRef, useState } from "react";
import type { ApprovalRequest, WorkspaceInfo } from "../../../types";
import {
  ToastActions,
  ToastBody,
  ToastCard,
  ToastError,
  ToastHeader,
  ToastTitle,
  ToastViewport,
} from "../../design-system/components/toast/ToastPrimitives";

import { approvalChoices, approvalNotice, approvalRequestKey } from "@utils/approvalProtocol";
import type { ApprovalResponse } from "@utils/approvalProtocol";

type ApprovalToastsProps = {
  approvals: ApprovalRequest[];
  workspaces: WorkspaceInfo[];
  onDecision: (request: ApprovalRequest, decision: ApprovalResponse) => void | Promise<void>;
  onRemember?: (request: ApprovalRequest, command: string[]) => void;
};

export function ApprovalToasts({
  approvals,
  workspaces,
  onDecision,
  onRemember: _onRemember,
}: ApprovalToastsProps) {
  const workspaceLabels = useMemo(
    () => new Map(workspaces.map((workspace) => [workspace.id, workspace.name])),
    [workspaces],
  );

  const submitted = useRef(new WeakSet<ApprovalRequest>());
  const [busy, setBusy] = useState(new Set<ApprovalRequest>());
  const [errors, setErrors] = useState(new Map<ApprovalRequest, string>());
  const decide = async (request: ApprovalRequest, response: ApprovalResponse) => {
    if (submitted.current.has(request)) return;
    submitted.current.add(request);
    setBusy((current) => new Set(current).add(request));
    try {
      await onDecision(request, response);
    } catch (error) {
      setErrors((current) => new Map(current).set(request, `Response could not be confirmed: ${String(error)}. Reconnect to refresh the request.`));
    }
  };

  if (!approvals.length) {
    return null;
  }

  const formatLabel = (value: string) =>
    value
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/_/g, " ")
      .trim();

  const methodLabel = (method: string) => {
    const trimmed = method.replace(/^codex\/requestApproval\/?/, "");
    return trimmed || method;
  };

  const renderParamValue = (value: unknown) => {
    if (value === null || value === undefined) {
      return { text: "None", isCode: false };
    }
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return { text: String(value), isCode: false };
    }
    if (Array.isArray(value)) {
      if (value.every((entry) => ["string", "number", "boolean"].includes(typeof entry))) {
        return { text: value.map(String).join(", "), isCode: false };
      }
      return { text: JSON.stringify(value, null, 2), isCode: true };
    }
    return { text: JSON.stringify(value, null, 2), isCode: true };
  };

  return (
    <ToastViewport className="approval-toasts" role="region" ariaLive="assertive">
      {approvals.map((request) => {
        const workspaceName = workspaceLabels.get(request.workspace_id);
        const params = request.params ?? {};
        const entries = Object.entries(params);
        const key = approvalRequestKey(request);
        const notice = approvalNotice(request);
        return (
          <ToastCard
            key={key}
            className="approval-toast"
            role="alert"
          >
            <ToastHeader className="approval-toast-header">
              <ToastTitle className="approval-toast-title">Approval needed</ToastTitle>
              {workspaceName ? (
                <div className="approval-toast-workspace">{workspaceName}</div>
              ) : null}
            </ToastHeader>
            <div className="approval-toast-method">{methodLabel(request.method)}</div>
            {notice ? <ToastBody>{notice}</ToastBody> : null}
            <div className="approval-toast-details">
              {entries.length ? (
                entries.map(([key, value]) => {
                  const rendered = renderParamValue(value);
                  return (
                    <div key={key} className="approval-toast-detail">
                      <div className="approval-toast-detail-label">
                        {formatLabel(key)}
                      </div>
                      {rendered.isCode ? (
                        <ToastError className="approval-toast-detail-code">
                          {rendered.text}
                        </ToastError>
                      ) : (
                        <ToastBody className="approval-toast-detail-value">
                          {rendered.text}
                        </ToastBody>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="approval-toast-detail approval-toast-detail-empty">
                  No extra details.
                </div>
              )}
            </div>
            <ToastActions className="approval-toast-actions">
              {approvalChoices(request).map((choice) => (
                <button key={choice.label} className="secondary" disabled={busy.has(request)}
                  onClick={() => { void decide(request, choice.result); }}>{choice.label}</button>
              ))}
            </ToastActions>
            {errors.has(request) ? <ToastError>{errors.get(request)}</ToastError> : null}
          </ToastCard>
        );
      })}
    </ToastViewport>
  );
}
