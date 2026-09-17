use std::collections::HashMap;
use std::future::Future;
use std::path::PathBuf;
use std::sync::Arc;
use std::sync::OnceLock;

use tokio::sync::Mutex;

use crate::backend::app_server::WorkspaceSession;
use crate::codex::args::resolve_workspace_codex_args;
use crate::codex::home::resolve_workspace_codex_home;
use crate::shared::process_core::kill_child_process_tree;
use crate::types::{AppSettings, WorkspaceEntry};

use super::helpers::{resolve_entry_and_parent, shared_session_process_cwd};

static CONNECT_WORKSPACE_SPAWN_LOCK: OnceLock<Mutex<()>> = OnceLock::new();

pub(super) fn workspace_session_spawn_lock() -> &'static Mutex<()> {
    CONNECT_WORKSPACE_SPAWN_LOCK.get_or_init(|| Mutex::new(()))
}

async fn session_process_is_alive(session: &Arc<WorkspaceSession>) -> bool {
    let mut child = session.child.lock().await;
    matches!(child.try_wait(), Ok(None))
}

async fn remove_session_references(
    sessions: &Mutex<HashMap<String, Arc<WorkspaceSession>>>,
    session: &Arc<WorkspaceSession>,
) {
    let mut sessions = sessions.lock().await;
    sessions.retain(|_, candidate| !Arc::ptr_eq(candidate, session));
}

pub(super) async fn take_live_shared_session(
    sessions: &Mutex<HashMap<String, Arc<WorkspaceSession>>>,
) -> Option<Arc<WorkspaceSession>> {
    loop {
        let existing_session = {
            let sessions = sessions.lock().await;
            sessions.values().next().cloned()
        };
        let Some(existing_session) = existing_session else {
            return None;
        };
        if session_process_is_alive(&existing_session).await {
            return Some(existing_session);
        }
        remove_session_references(sessions, &existing_session).await;
    }
}

pub(crate) async fn connect_workspace_core<F, Fut>(
    workspace_id: String,
    workspaces: &Mutex<HashMap<String, WorkspaceEntry>>,
    sessions: &Mutex<HashMap<String, Arc<WorkspaceSession>>>,
    app_settings: &Mutex<AppSettings>,
    spawn_session: F,
) -> Result<(), String>
where
    F: Fn(WorkspaceEntry, Option<String>, Option<String>, Option<PathBuf>, PathBuf) -> Fut,
    Fut: Future<Output = Result<Arc<WorkspaceSession>, String>>,
{
    let (entry, parent_entry) = resolve_entry_and_parent(workspaces, &workspace_id).await?;
    let _spawn_guard = workspace_session_spawn_lock().lock().await;
    if let Some(existing_for_entry) = {
        let sessions = sessions.lock().await;
        sessions.get(&entry.id).cloned()
    } {
        if session_process_is_alive(&existing_for_entry).await {
            return Ok(());
        }
        remove_session_references(sessions, &existing_for_entry).await;
    }
    if let Some(existing_session) = take_live_shared_session(sessions).await {
        existing_session
            .register_workspace_with_path(&entry.id, Some(&entry.path))
            .await;
        sessions
            .lock()
            .await
            .insert(entry.id.clone(), existing_session);
        return Ok(());
    }
    let (default_bin, codex_args) = {
        let settings = app_settings.lock().await;
        (
            settings.codex_bin.clone(),
            resolve_workspace_codex_args(&entry, parent_entry.as_ref(), Some(&settings)),
        )
    };
    let codex_home = resolve_workspace_codex_home(&entry, parent_entry.as_ref());
    let session = spawn_session(
        entry.clone(),
        default_bin,
        codex_args,
        codex_home,
        shared_session_process_cwd(&entry, parent_entry.as_ref()),
    )
    .await?;
    session
        .register_workspace_with_path(&entry.id, Some(&entry.path))
        .await;
    sessions.lock().await.insert(entry.id, session);
    Ok(())
}

pub(super) async fn kill_session_by_id(
    sessions: &Mutex<HashMap<String, Arc<WorkspaceSession>>>,
    id: &str,
) {
    let (removed, still_referenced) = {
        let mut sessions = sessions.lock().await;
        let removed = sessions.remove(id);
        let still_referenced = removed.as_ref().is_some_and(|session| {
            sessions
                .values()
                .any(|candidate| Arc::ptr_eq(candidate, session))
        });
        (removed, still_referenced)
    };
    if let Some(session) = removed {
        session.unregister_workspace(id).await;
        if still_referenced {
            return;
        }
        let mut child = session.child.lock().await;
        kill_child_process_tree(&mut child).await;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use std::collections::{HashMap, HashSet};
    use std::process::Stdio;
    use std::sync::atomic::{AtomicU64, AtomicUsize, Ordering};
    use std::sync::Arc;

    use tokio::process::Command;
    use tokio::sync::Mutex;

    use crate::types::{WorkspaceKind, WorkspaceSettings};

    fn make_workspace_entry(id: &str) -> WorkspaceEntry {
        WorkspaceEntry {
            id: id.to_string(),
            name: id.to_string(),
            path: "/tmp".to_string(),
            kind: WorkspaceKind::Main,
            parent_id: None,
            worktree: None,
            settings: WorkspaceSettings::default(),
        }
    }

    fn make_session(entry: WorkspaceEntry) -> Arc<WorkspaceSession> {
        make_session_in(entry, None)
    }

    fn make_session_in(
        _entry: WorkspaceEntry,
        process_cwd: Option<&PathBuf>,
    ) -> Arc<WorkspaceSession> {
        let mut cmd = if cfg!(windows) {
            let mut cmd = Command::new("cmd");
            cmd.args(["/C", "more"]);
            cmd
        } else {
            let mut cmd = Command::new("sh");
            cmd.args(["-c", "cat"]);
            cmd
        };

        if let Some(process_cwd) = process_cwd {
            cmd.current_dir(process_cwd);
        }
        cmd.kill_on_drop(true)
            .stdin(Stdio::piped())
            .stdout(Stdio::null())
            .stderr(Stdio::null());

        let mut child = cmd.spawn().expect("spawn dummy child");
        let stdin = child.stdin.take().expect("dummy child stdin");

        Arc::new(WorkspaceSession {
            command_turns: Mutex::new(Default::default()),
            command_turns_changed: tokio::sync::Notify::new(),
            session_id: uuid::Uuid::new_v4().to_string(),
            codex_args: None,
            child: Mutex::new(child),
            stdin: Mutex::new(stdin),
            pending: Mutex::new(HashMap::new()),
            server_requests: Mutex::new(HashMap::new()),
            request_context: Mutex::new(HashMap::new()),
            thread_workspace: Mutex::new(HashMap::new()),
            hidden_thread_ids: Mutex::new(HashSet::new()),
            next_id: AtomicU64::new(0),
            background_thread_callbacks: Mutex::new(HashMap::new()),
            owner_workspace_id: "test-owner".to_string(),
            workspace_ids: Mutex::new(HashSet::from(["test-owner".to_string()])),
            workspace_roots: Mutex::new(HashMap::new()),
        })
    }

    #[test]
    fn connect_workspace_is_noop_when_already_connected() {
        tokio::runtime::Runtime::new().unwrap().block_on(async {
            let entry = make_workspace_entry("ws-1");
            let workspaces = Mutex::new(HashMap::from([(entry.id.clone(), entry.clone())]));
            let sessions = Mutex::new(HashMap::from([(
                entry.id.clone(),
                make_session(entry.clone()),
            )]));
            let app_settings = Mutex::new(AppSettings::default());
            let spawn_calls = Arc::new(AtomicUsize::new(0));
            let spawn_calls_ref = spawn_calls.clone();

            connect_workspace_core(
                entry.id.clone(),
                &workspaces,
                &sessions,
                &app_settings,
                move |_entry, _default_bin, _codex_args, _codex_home, _process_cwd| {
                    let spawn_calls_ref = spawn_calls_ref.clone();
                    async move {
                        spawn_calls_ref.fetch_add(1, Ordering::SeqCst);
                        Err("should not spawn".to_string())
                    }
                },
            )
            .await
            .expect("connect should be noop");

            assert_eq!(spawn_calls.load(Ordering::SeqCst), 0);
            kill_session_by_id(&sessions, &entry.id).await;
        });
    }

    #[test]
    fn connect_workspace_spawns_when_not_connected() {
        tokio::runtime::Runtime::new().unwrap().block_on(async {
            let entry = make_workspace_entry("ws-2");
            let workspaces = Mutex::new(HashMap::from([(entry.id.clone(), entry.clone())]));
            let sessions = Mutex::new(HashMap::<String, Arc<WorkspaceSession>>::new());
            let app_settings = Mutex::new(AppSettings::default());
            let spawn_calls = Arc::new(AtomicUsize::new(0));
            let spawn_calls_ref = spawn_calls.clone();
            let entry_for_spawn = entry.clone();

            connect_workspace_core(
                entry.id.clone(),
                &workspaces,
                &sessions,
                &app_settings,
                move |_entry, _default_bin, _codex_args, _codex_home, _process_cwd| {
                    let spawn_calls_ref = spawn_calls_ref.clone();
                    let entry_for_spawn = entry_for_spawn.clone();
                    async move {
                        spawn_calls_ref.fetch_add(1, Ordering::SeqCst);
                        Ok(make_session(entry_for_spawn))
                    }
                },
            )
            .await
            .expect("connect should spawn");

            assert_eq!(spawn_calls.load(Ordering::SeqCst), 1);
            assert!(sessions.lock().await.contains_key(&entry.id));
            kill_session_by_id(&sessions, &entry.id).await;
        });
    }

    #[test]
    fn first_worktree_connection_keeps_parent_server_alive_after_worktree_removal() {
        tokio::runtime::Runtime::new().unwrap().block_on(async {
            let fixture =
                std::env::temp_dir().join(format!("moonveil-shared-cwd-{}", uuid::Uuid::new_v4()));
            let parent_path = fixture.join("parent");
            let worktree_path = fixture.join("worktree");
            std::fs::create_dir_all(&parent_path).unwrap();
            std::fs::create_dir_all(&worktree_path).unwrap();
            let mut parent = make_workspace_entry("parent");
            parent.path = parent_path.to_string_lossy().into_owned();
            let mut worktree = make_workspace_entry("worktree");
            worktree.path = worktree_path.to_string_lossy().into_owned();
            worktree.kind = WorkspaceKind::Worktree;
            worktree.parent_id = Some(parent.id.clone());
            let workspaces = Mutex::new(HashMap::from([
                (parent.id.clone(), parent.clone()),
                (worktree.id.clone(), worktree.clone()),
            ]));
            let sessions = Mutex::new(HashMap::<String, Arc<WorkspaceSession>>::new());
            let app_settings = Mutex::new(AppSettings::default());

            connect_workspace_core(
                worktree.id.clone(),
                &workspaces,
                &sessions,
                &app_settings,
                |entry, _default_bin, _codex_args, _codex_home, process_cwd| {
                    assert_eq!(entry.path, worktree.path);
                    assert_eq!(process_cwd, parent_path);
                    std::future::ready(Ok(make_session_in(entry, Some(&process_cwd))))
                },
            )
            .await
            .expect("first worktree connection should spawn in its parent");
            connect_workspace_core(
                parent.id.clone(),
                &workspaces,
                &sessions,
                &app_settings,
                |_entry, _default_bin, _codex_args, _codex_home, _process_cwd| {
                    std::future::ready(Err("parent should reuse the shared server".to_string()))
                },
            )
            .await
            .expect("parent should attach to the first worktree's shared server");
            let shared_session = {
                let sessions = sessions.lock().await;
                assert!(Arc::ptr_eq(&sessions[&parent.id], &sessions[&worktree.id]));
                sessions[&parent.id].clone()
            };
            assert_eq!(
                shared_session.workspace_roots.lock().await[&worktree.id],
                if cfg!(windows) {
                    worktree.path.replace('\\', "/").to_ascii_lowercase()
                } else {
                    worktree.path.clone()
                }
            );

            super::super::worktree::remove_worktree_core(
                worktree.id.clone(),
                &workspaces,
                &sessions,
                &fixture.join("workspaces.json"),
                |_path, _args| {
                    std::future::ready(Err("fixture is not registered with Git".to_string()))
                },
                |error| error == "fixture is not registered with Git",
                |path| std::fs::remove_dir_all(path).map_err(|error| error.to_string()),
            )
            .await
            .expect("removal must release the worktree without killing the shared parent server");

            assert!(!worktree_path.exists());
            assert!(!workspaces.lock().await.contains_key(&worktree.id));
            assert_eq!(workspaces.lock().await[&parent.id].path, parent.path);
            assert!(Arc::ptr_eq(
                &sessions.lock().await[&parent.id],
                &shared_session
            ));
            assert!(!shared_session
                .workspace_roots
                .lock()
                .await
                .contains_key(&worktree.id));
            assert!(session_process_is_alive(&shared_session).await);
            kill_session_by_id(&sessions, &parent.id).await;
            assert!(!session_process_is_alive(&shared_session).await);
            std::fs::remove_dir_all(&fixture).unwrap();
        });
    }

    #[test]
    fn adding_worktree_without_a_session_uses_parent_process_cwd() {
        tokio::runtime::Runtime::new().unwrap().block_on(async {
            let fixture = std::env::temp_dir().join(format!(
                "moonveil-new-worktree-cwd-{}",
                uuid::Uuid::new_v4()
            ));
            let parent_path = fixture.join("parent");
            std::fs::create_dir_all(&parent_path).unwrap();
            let mut parent = make_workspace_entry("parent");
            parent.path = parent_path.to_string_lossy().into_owned();
            let workspaces = Mutex::new(HashMap::from([(parent.id.clone(), parent.clone())]));
            let sessions = Mutex::new(HashMap::<String, Arc<WorkspaceSession>>::new());
            let settings = Mutex::new(AppSettings::default());
            let spawn_calls = AtomicUsize::new(0);
            let expected_worktree_path = fixture.join("worktrees").join(&parent.id).join("fixture");

            let result = super::super::worktree::add_worktree_core(
                parent.id.clone(),
                "fixture".to_string(),
                None,
                false,
                &fixture,
                &workspaces,
                &sessions,
                &settings,
                &fixture.join("workspaces.json"),
                str::to_string,
                |root, name| Ok(root.join(name)),
                |_path, _branch| std::future::ready(Ok(false)),
                Some(|_path: &PathBuf, _branch: &str| std::future::ready(Ok(None::<String>))),
                |_path, _args| std::future::ready(Ok(())),
                |entry, _default_bin, _codex_args, _codex_home, process_cwd| {
                    spawn_calls.fetch_add(1, Ordering::SeqCst);
                    assert_eq!(PathBuf::from(entry.path), expected_worktree_path);
                    assert_eq!(process_cwd, parent_path);
                    std::future::ready(Err("fixture stopped before server startup".to_string()))
                },
            )
            .await;
            assert_eq!(result.unwrap_err(), "fixture stopped before server startup");
            assert_eq!(spawn_calls.load(Ordering::SeqCst), 1);
            std::fs::remove_dir_all(&fixture).unwrap();
        });
    }
}
