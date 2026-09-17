import type { MoonveilCompanion, MoonveilState } from "./types";

export const MOONVEIL_STORAGE_KEY = "moonveil.guild.v1";

export const seedCompanions: MoonveilCompanion[] = [
  {
    id: "companion-elaria",
    name: "Elaria",
    role: "Arcane Scholar",
    portrait: "elaria",
    detail: "detailed",
    instructions:
      "You are Elaria, a careful scholarly companion. Prioritize evidence, explain architecture clearly, and surface uncertainty instead of bluffing.",
  },
  {
    id: "companion-sylra",
    name: "Sylra",
    role: "Guild Warden",
    portrait: "sylra",
    detail: "balanced",
    instructions:
      "You are Sylra, a calm engineering companion. Be decisive, practical, security-conscious, and keep implementation moving without sacrificing correctness.",
  },
  {
    id: "companion-lyra",
    name: "Lyra",
    role: "Muse of Sparks",
    portrait: "lyra",
    detail: "balanced",
    instructions:
      "You are Lyra, a creative companion. Generate strong alternatives, preserve product coherence, and translate imaginative ideas into usable implementation choices.",
  },
  {
    id: "companion-rowan",
    name: "Rowan",
    role: "Wayfinder",
    portrait: "rowan",
    detail: "concise",
    instructions:
      "You are Rowan, a pragmatic wayfinder. Prefer the shortest reliable path, make dependencies explicit, and turn complex work into clear next actions.",
  },
  {
    id: "companion-noctis",
    name: "Noctis",
    role: "Nocturne Sage",
    portrait: "noctis",
    detail: "detailed",
    instructions:
      "You are Noctis, a skeptical reviewer. Look for hidden failure modes, security gaps, stale assumptions, and contradictions before accepting a design.",
  },
];

export function initialMoonveilState(): MoonveilState {
  return {
    schemaVersion: 1,
    selectedCompanionId: "companion-sylra",
    theme: "dark",
    companions: seedCompanions.map((companion) => ({ ...companion })),
    projects: [],
    conversations: [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseMoonveilState(raw: string | null): MoonveilState {
  if (!raw) return initialMoonveilState();
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || value.schemaVersion !== 1 || !Array.isArray(value.companions)) {
      return initialMoonveilState();
    }
    const defaults = initialMoonveilState();
    const companions: MoonveilCompanion[] = [];
    const portraits = new Set(seedCompanions.map((entry) => entry.portrait));
    for (const entry of value.companions.slice(0, 50)) {
      if (!isRecord(entry) || typeof entry.id !== "string" || !entry.id ||
          typeof entry.name !== "string" || !entry.name.trim() ||
          typeof entry.instructions !== "string" || companions.some((item) => item.id === entry.id)) continue;
      companions.push({
        id: entry.id,
        name: entry.name,
        role: typeof entry.role === "string" ? entry.role : "Guild Companion",
        portrait: portraits.has(entry.portrait as MoonveilCompanion["portrait"])
          ? entry.portrait as MoonveilCompanion["portrait"] : "sylra",
        instructions: entry.instructions,
        detail: entry.detail === "concise" || entry.detail === "detailed" ? entry.detail : "balanced",
      });
    }
    const restoredCompanions = companions.length ? companions : defaults.companions;
    const companionIds = new Set(restoredCompanions.map((entry) => entry.id));
    const parseAssociation = (entry: unknown) => {
      if (!isRecord(entry) || typeof entry.companionId !== "string" || !companionIds.has(entry.companionId) ||
          typeof entry.workspaceId !== "string" || !entry.workspaceId ||
          typeof entry.workspacePath !== "string" || !entry.workspacePath) return [];
      return [{ companionId: entry.companionId, workspaceId: entry.workspaceId, workspacePath: entry.workspacePath }];
    };
    return {
      schemaVersion: 1,
      selectedCompanionId: typeof value.selectedCompanionId === "string" && companionIds.has(value.selectedCompanionId)
        ? value.selectedCompanionId : restoredCompanions[0].id,
      theme: value.theme === "dawn" ? "dawn" : "dark",
      companions: restoredCompanions,
      projects: Array.isArray(value.projects) ? value.projects.slice(0, 500).flatMap(parseAssociation) : [],
      conversations: Array.isArray(value.conversations)
        ? value.conversations.slice(0, 2000).flatMap((entry: unknown) => {
            if (!isRecord(entry) || typeof entry.threadId !== "string" || !entry.threadId) return [];
            const threadId = entry.threadId;
            return parseAssociation(entry).map((association) => ({ ...association, threadId }));
          })
        : [],
    };
  } catch {
    return initialMoonveilState();
  }
}

export function upsertProjectAssociation(
  state: MoonveilState,
  companionId: string,
  workspaceId: string,
  workspacePath: string,
): MoonveilState {
  const projects = state.projects.filter(
    (entry) => !(entry.companionId === companionId && entry.workspaceId === workspaceId),
  );
  return {
    ...state,
    projects: [...projects, { companionId, workspaceId, workspacePath }],
  };
}

export function upsertConversationAssociation(
  state: MoonveilState,
  companionId: string,
  workspaceId: string,
  workspacePath: string,
  threadId: string,
): MoonveilState {
  const next = upsertProjectAssociation(state, companionId, workspaceId, workspacePath);
  const conversations = next.conversations.filter(
    (entry) => !(entry.companionId === companionId && entry.workspaceId === workspaceId && entry.threadId === threadId),
  );
  return {
    ...next,
    conversations: [...conversations, { companionId, workspaceId, workspacePath, threadId }],
  };
}
