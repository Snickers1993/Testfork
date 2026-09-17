import type { MoonveilGuildProps } from "@/features/moonveil/types";
import type {
  AccountSnapshot,
  LocalUsageSnapshot,
  RateLimitSnapshot,
  ThreadSummary,
  WorkspaceInfo,
} from "../../../types";
import { HomeActions } from "./HomeActions";
import { HomeLatestAgentsSection } from "./HomeLatestAgentsSection";
import { HomeUsageSection } from "./HomeUsageSection";
import { GuildHall } from "../../moonveil/GuildHall";
import type {
  LatestAgentRun,
  UsageMetric,
  UsageWorkspaceOption,
} from "../homeTypes";

type HomeProps = {
  onAddWorkspace: () => void;
  onAddWorkspaceFromUrl: () => void;
  latestAgentRuns: LatestAgentRun[];
  isLoadingLatestAgents: boolean;
  localUsageSnapshot: LocalUsageSnapshot | null;
  isLoadingLocalUsage: boolean;
  localUsageError: string | null;
  onRefreshLocalUsage: () => void;
  usageMetric: UsageMetric;
  onUsageMetricChange: (metric: UsageMetric) => void;
  usageWorkspaceId: string | null;
  usageWorkspaceOptions: UsageWorkspaceOption[];
  onUsageWorkspaceChange: (workspaceId: string | null) => void;
  accountRateLimits: RateLimitSnapshot | null;
  usageShowRemaining: boolean;
  accountInfo: AccountSnapshot | null;
  onSelectThread: (workspaceId: string, threadId: string) => void;
  moonveilWorkspaces?: WorkspaceInfo[];
  moonveilThreadsByWorkspace?: Record<string, ThreadSummary[]>;
  moonveilActiveWorkspaceId?: string | null;
  moonveilActiveThreadId?: string | null;
  onCreateMoonveilThread?: MoonveilGuildProps["onCreateThread"];
};

export function Home({
  onAddWorkspace,
  onAddWorkspaceFromUrl,
  latestAgentRuns,
  isLoadingLatestAgents,
  localUsageSnapshot,
  isLoadingLocalUsage,
  localUsageError,
  onRefreshLocalUsage,
  usageMetric,
  onUsageMetricChange,
  usageWorkspaceId,
  usageWorkspaceOptions,
  onUsageWorkspaceChange,
  accountRateLimits,
  usageShowRemaining,
  accountInfo,
  onSelectThread,
  moonveilWorkspaces = [],
  moonveilThreadsByWorkspace = {},
  moonveilActiveWorkspaceId = null,
  moonveilActiveThreadId = null,
  onCreateMoonveilThread = async () => null,
}: HomeProps) {
  return (
    <div className="home moonveil-home">
      <GuildHall
        workspaces={moonveilWorkspaces}
        threadsByWorkspace={moonveilThreadsByWorkspace}
        activeWorkspaceId={moonveilActiveWorkspaceId}
        activeThreadId={moonveilActiveThreadId}
        onAddWorkspace={onAddWorkspace}
        onCreateThread={onCreateMoonveilThread}
        onOpenThread={onSelectThread}
      />
      <details className="moonveil-codex-dashboard">
        <summary>Codex dashboard & usage</summary>
        <div className="moonveil-codex-dashboard-body">
          <HomeLatestAgentsSection
            latestAgentRuns={latestAgentRuns}
            isLoadingLatestAgents={isLoadingLatestAgents}
            onSelectThread={onSelectThread}
          />
          <HomeActions
            onAddWorkspace={onAddWorkspace}
            onAddWorkspaceFromUrl={onAddWorkspaceFromUrl}
          />
          <HomeUsageSection
            accountInfo={accountInfo}
            accountRateLimits={accountRateLimits}
            isLoadingLocalUsage={isLoadingLocalUsage}
            localUsageError={localUsageError}
            localUsageSnapshot={localUsageSnapshot}
            onRefreshLocalUsage={onRefreshLocalUsage}
            onUsageMetricChange={onUsageMetricChange}
            onUsageWorkspaceChange={onUsageWorkspaceChange}
            usageMetric={usageMetric}
            usageShowRemaining={usageShowRemaining}
            usageWorkspaceId={usageWorkspaceId}
            usageWorkspaceOptions={usageWorkspaceOptions}
          />
        </div>
      </details>
    </div>
  );
}
