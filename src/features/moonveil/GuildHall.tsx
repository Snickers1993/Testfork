import { useEffect, useMemo, useRef, useState } from "react";
import Plus from "lucide-react/dist/esm/icons/plus";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import MessageSquare from "lucide-react/dist/esm/icons/message-square";
import FolderOpen from "lucide-react/dist/esm/icons/folder-open";
import type { MoonveilCompanion, MoonveilGuildProps, MoonveilState } from "./types";
import {
  initialMoonveilState,
  MOONVEIL_STORAGE_KEY,
  parseMoonveilState,
  upsertConversationAssociation,
  upsertProjectAssociation,
} from "./model";

function readState() {
  if (typeof window === "undefined") return initialMoonveilState();
  try {
    return parseMoonveilState(window.localStorage.getItem(MOONVEIL_STORAGE_KEY));
  } catch {
    return initialMoonveilState();
  }
}

function portraitUrl(companion: MoonveilCompanion) {
  return `/moonveil/${companion.portrait}.svg`;
}

export function GuildHall({
  workspaces,
  threadsByWorkspace,
  activeWorkspaceId,
  activeThreadId,
  onAddWorkspace,
  onCreateThread,
  onOpenThread,
}: MoonveilGuildProps) {
  const [state, setState] = useState<MoonveilState>(readState);
  const [workspaceId, setWorkspaceId] = useState<string>(activeWorkspaceId ?? workspaces[0]?.id ?? "");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stateRef = useRef(state);
  const creatingRef = useRef(false);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Save before navigation unmounts the Guild Hall, including when the user
  // changes companions while a native thread is starting.
  const persistState = (update: (current: MoonveilState) => MoonveilState) => {
    const next = update(stateRef.current);
    window.localStorage.setItem(MOONVEIL_STORAGE_KEY, JSON.stringify(next));
    stateRef.current = next;
    if (mountedRef.current) setState(next);
  };

  const updateState = (update: (current: MoonveilState) => MoonveilState) => {
    try {
      persistState(update);
      setError(null);
    } catch (cause) {
      setError("Moonveil could not save guild state: " + (cause instanceof Error ? cause.message : String(cause)));
    }
  };

  useEffect(() => {
    if (!workspaceId && workspaces[0]?.id) setWorkspaceId(workspaces[0].id);
  }, [workspaceId, workspaces]);

  const activeCompanionId = state.conversations.find(
    (entry) => entry.workspaceId === activeWorkspaceId && entry.threadId === activeThreadId,
  )?.companionId;
  useEffect(() => {
    // Native navigation can select a companion, but a later explicit roster
    // selection must not be overridden by the retained active thread.
    if (activeCompanionId && activeCompanionId !== stateRef.current.selectedCompanionId) {
      const next = { ...stateRef.current, selectedCompanionId: activeCompanionId };
      try {
        window.localStorage.setItem(MOONVEIL_STORAGE_KEY, JSON.stringify(next));
        stateRef.current = next;
        setState(next);
      } catch (cause) {
        setError("Moonveil could not save guild state: " + String(cause));
      }
    }
  }, [activeCompanionId]);

  const companion =
    state.companions.find((entry) => entry.id === state.selectedCompanionId) ?? state.companions[0];
  const workspace = workspaces.find((entry) => entry.id === workspaceId) ?? null;
  const workspaceThreads = workspace ? threadsByWorkspace[workspace.id] ?? [] : [];
  const savedConversations = useMemo(
    () =>
      state.conversations
        .filter((entry) => entry.companionId === companion.id)
        .map((entry) => ({
          ...entry,
          workspace: workspaces.find((candidate) => candidate.id === entry.workspaceId),
          thread: (threadsByWorkspace[entry.workspaceId] ?? []).find(
            (candidate) => candidate.id === entry.threadId,
          ),
        })),
    [companion.id, state.conversations, threadsByWorkspace, workspaces],
  );

  const selectCompanion = (companionId: string) => {
    updateState((current) => ({ ...current, selectedCompanionId: companionId }));
  };

  const addCompanion = () => {
    const name = window.prompt("Companion name")?.trim();
    if (!name) return;
    const role = window.prompt("Role", "Guild Companion")?.trim() || "Guild Companion";
    const id = `companion-custom-${Date.now().toString(36)}`;
    updateState((current) => ({
      ...current,
      selectedCompanionId: id,
      companions: [
        ...current.companions,
        {
          id,
          name: name.slice(0, 80),
          role: role.slice(0, 100),
          portrait: "sylra",
          detail: "balanced",
          instructions: `You are ${name}, a persistent Moonveil companion associated with normal Codex conversations.`,
        },
      ],
    }));
  };

  const associateProject = () => {
    if (!workspace) return;
    updateState((current) =>
      upsertProjectAssociation(current, companion.id, workspace.id, workspace.path),
    );
  };

  const createConversation = async () => {
    if (!workspace || creatingRef.current) return;
    setError(null);
    creatingRef.current = true;
    setIsCreating(true);
    let createdThreadId: string | null = null;
    try {
      if (!companion.instructions.trim()) {
        throw new Error("This companion needs instructions before starting a conversation.");
      }
      // Check storage before creating native state that needs a durable association.
      persistState((current) => current);
      createdThreadId = await onCreateThread(workspace.id, companion);
      if (!createdThreadId) throw new Error("Codex did not return a native thread ID.");
      const threadId = createdThreadId;
      persistState(() =>
        upsertConversationAssociation(
          parseMoonveilState(window.localStorage.getItem(MOONVEIL_STORAGE_KEY)),
          companion.id,
          workspace.id,
          workspace.path,
          threadId,
        ),
      );
      if (mountedRef.current) onOpenThread(workspace.id, threadId);
    } catch (cause) {
      const reason = cause instanceof Error ? cause.message : String(cause);
      if (mountedRef.current) setError(createdThreadId
        ? "Native conversation " + createdThreadId + " was created, but Moonveil could not finish saving or opening it: " + reason + ". Open that thread from the project sidebar; it has not been retried."
        : reason);
    } finally {
      creatingRef.current = false;
      if (mountedRef.current) setIsCreating(false);
    }
  };

  const linkConversation = (threadId: string) => {
    if (!workspace || !threadId) return;
    updateState((current) =>
      upsertConversationAssociation(
        current,
        companion.id,
        workspace.id,
        workspace.path,
        threadId,
      ),
    );
  };

  return (
    <section className="moonveil-guild" data-theme={state.theme}>
      <div className="moonveil-guild-hero">
        <img src="/moonveil/guild-hall.svg" alt="Moonveil Guild Hall" className="moonveil-guild-scene" />
        <div className="moonveil-guild-scrim" />
        <div className="moonveil-guild-brand">
          <div className="moonveil-kicker">MOONVEIL · GUILD HALL</div>
          <h1>Welcome back to the guild.</h1>
          <p>Choose a companion, bind a project, then continue through normal Codex threads.</p>
        </div>
        <button
          className="moonveil-theme-toggle"
          onClick={() => updateState((current) => ({ ...current, theme: current.theme === "dark" ? "dawn" : "dark" }))}
        >
          {state.theme === "dark" ? "Dawn" : "Dusk"}
        </button>
      </div>

      <div className="moonveil-roster" aria-label="Guild companions">
        {state.companions.map((entry) => {
          const selected = entry.id === companion.id;
          const linkedCount = state.conversations.filter((item) => item.companionId === entry.id).length;
          return (
            <button
              key={entry.id}
              className={`moonveil-companion-card${selected ? " selected" : ""}`}
              onClick={() => selectCompanion(entry.id)}
              aria-pressed={selected}
              aria-label={`${entry.name}, ${entry.role}`}
            >
              <span className="moonveil-portrait-frame">
                <img src={portraitUrl(entry)} alt="" />
              </span>
              <strong>{entry.name}</strong>
              <span>{entry.role}</span>
              <small>{linkedCount ? `${linkedCount} linked conversation${linkedCount === 1 ? "" : "s"}` : "Ready for a project"}</small>
            </button>
          );
        })}
        <button className="moonveil-companion-card moonveil-add-companion" onClick={addCompanion}>
          <span className="moonveil-add-companion-icon"><Plus aria-hidden /></span>
          <strong>Add</strong>
          <span>New companion</span>
          <small>Persistent Moonveil identity</small>
        </button>
      </div>

      <div className="moonveil-workbench">
        <div className="moonveil-companion-focus">
          <img src={portraitUrl(companion)} alt="" />
          <div>
            <span className="moonveil-kicker">ACTIVE COMPANION</span>
            <h2>{companion.name}</h2>
            <p>{companion.instructions}</p>
          </div>
        </div>

        <div className="moonveil-project-panel">
          <div className="moonveil-panel-heading">
            <div>
              <span className="moonveil-kicker">PROJECT → CODEX THREAD</span>
              <h3>Enter the workshop</h3>
            </div>
            <Sparkles aria-hidden />
          </div>
          {workspaces.length ? (
            <>
              <label className="moonveil-field">
                <span>Project / workspace</span>
                <select value={workspaceId} onChange={(event) => setWorkspaceId(event.target.value)}>
                  {workspaces.map((entry) => (
                    <option key={entry.id} value={entry.id}>{entry.name}</option>
                  ))}
                </select>
              </label>
              <div className="moonveil-actions">
                <button className="secondary" onClick={associateProject} disabled={!workspace}>
                  <FolderOpen aria-hidden /> Associate project
                </button>
                <button className="primary" onClick={createConversation} disabled={!workspace || isCreating}>
                  <MessageSquare aria-hidden /> {isCreating ? "Opening…" : `New conversation with ${companion.name}`}
                </button>
              </div>
              {workspaceThreads.length ? (
                <label className="moonveil-field">
                  <span>Or link an existing native Codex thread</span>
                  <select defaultValue="" onChange={(event) => { linkConversation(event.target.value); event.currentTarget.value = ""; }}>
                    <option value="">Choose conversation…</option>
                    {workspaceThreads.map((thread) => (
                      <option key={thread.id} value={thread.id}>{thread.name || thread.id}</option>
                    ))}
                  </select>
                </label>
              ) : null}
            </>
          ) : (
            <button className="primary moonveil-add-project" onClick={onAddWorkspace}>
              <Plus aria-hidden /> Add your first project
            </button>
          )}
          {error ? <div className="moonveil-error" role="alert">{error}</div> : null}
        </div>
      </div>

      <div className="moonveil-conversations">
        <div className="moonveil-panel-heading">
          <div>
            <span className="moonveil-kicker">CONTINUITY</span>
            <h3>{companion.name}’s conversations</h3>
          </div>
        </div>
        {savedConversations.length ? (
          <div className="moonveil-conversation-grid">
            {savedConversations.map((entry) => (
              <button
                key={`${entry.workspaceId}:${entry.threadId}`}
                className="moonveil-conversation-row"
                onClick={() => onOpenThread(entry.workspaceId, entry.threadId)}
              >
                <span>{entry.thread?.name || "Codex conversation"}</span>
                <small>{entry.workspace?.name || entry.workspacePath}</small>
                <code>{entry.threadId}</code>
              </button>
            ))}
          </div>
        ) : (
          <p className="moonveil-empty">No conversations are bound to this companion yet. Native Codex history remains owned by Codex; Moonveil only remembers the association.</p>
        )}
      </div>
    </section>
  );
}
