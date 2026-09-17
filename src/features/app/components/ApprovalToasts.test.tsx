// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(cleanup);
import type { ApprovalRequest, WorkspaceInfo } from "../../../types";
import { ApprovalToasts } from "./ApprovalToasts";

const workspaces: WorkspaceInfo[] = [{
  id: "workspace-1", name: "Workspace One", path: "/tmp/workspace-1", connected: true,
  settings: { sidebarCollapsed: false },
}];

const approvals: ApprovalRequest[] = [{
  workspace_id: "workspace-1", request_id: 1, method: "item/commandExecution/requestApproval",
  params: { command: "echo one" },
}];

describe("ApprovalToasts", () => {
  it("requires an explicit approval click", () => {
    const onDecision = vi.fn();
    render(<ApprovalToasts approvals={approvals} workspaces={workspaces} onDecision={onDecision} />);
    expect(screen.getByRole("region").getAttribute("aria-live")).toBe("assertive");
    fireEvent.keyDown(window, { key: "Enter" });
    expect(onDecision).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Approve once" }));
    expect(onDecision).toHaveBeenCalledWith(approvals[0], { decision: "accept" });
  });

  it("supports explicit decline", () => {
    const onDecision = vi.fn();
    render(<ApprovalToasts approvals={approvals} workspaces={workspaces} onDecision={onDecision} />);
    fireEvent.click(screen.getByRole("button", { name: "Decline" }));
    expect(onDecision).toHaveBeenCalledWith(approvals[0], { decision: "decline" });
  });
});


it("prevents duplicate decisions while preserving independent pending requests", () => {
  const onDecision = vi.fn(() => new Promise<void>(() => {}));
  const requests = [approvals[0], { ...approvals[0], request_id: "1" }];
  render(<ApprovalToasts approvals={requests} workspaces={workspaces} onDecision={onDecision} />);
  const buttons = screen.getAllByRole("button", { name: "Approve once" });
  fireEvent.click(buttons[0]);
  fireEvent.click(buttons[0]);
  fireEvent.click(buttons[1]);
  expect(onDecision).toHaveBeenCalledTimes(2);
  expect(buttons.every(button => (button as HTMLButtonElement).disabled)).toBe(true);
});

it("allows a newly delivered request after a connection reuses the same ID", () => {
  const onDecision = vi.fn();
  const { rerender } = render(<ApprovalToasts approvals={approvals} workspaces={workspaces} onDecision={onDecision} />);
  fireEvent.click(screen.getByRole("button", { name: "Approve once" }));
  rerender(<ApprovalToasts approvals={[]} workspaces={workspaces} onDecision={onDecision} />);
  rerender(<ApprovalToasts approvals={[{ ...approvals[0] }]} workspaces={workspaces} onDecision={onDecision} />);
  fireEvent.click(screen.getByRole("button", { name: "Approve once" }));
  expect(onDecision).toHaveBeenCalledTimes(2);
});
