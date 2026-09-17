import type { ThreadSummary, WorkspaceInfo } from "@/types";

export type MoonveilPortrait = "elaria" | "sylra" | "lyra" | "rowan" | "noctis";

export type MoonveilCompanion = {
  id: string;
  name: string;
  role: string;
  portrait: MoonveilPortrait;
  instructions: string;
  detail: "concise" | "balanced" | "detailed";
};

export type MoonveilProjectAssociation = {
  companionId: string;
  workspaceId: string;
  workspacePath: string;
};

export type MoonveilConversationAssociation = MoonveilProjectAssociation & {
  threadId: string;
};

export type MoonveilState = {
  schemaVersion: 1;
  selectedCompanionId: string;
  theme: "dark" | "dawn";
  companions: MoonveilCompanion[];
  projects: MoonveilProjectAssociation[];
  conversations: MoonveilConversationAssociation[];
};

export type MoonveilGuildProps = {
  workspaces: WorkspaceInfo[];
  threadsByWorkspace: Record<string, ThreadSummary[]>;
  activeWorkspaceId: string | null;
  activeThreadId: string | null;
  onAddWorkspace: () => void;
  onCreateThread: (workspaceId: string, companion: MoonveilCompanion) => Promise<string | null>;
  onOpenThread: (workspaceId: string, threadId: string) => void;
};
