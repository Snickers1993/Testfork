use std::path::{Path, PathBuf};

use crate::shared::process_core::tokio_command;
use crate::utils::{git_env_path, resolve_git_binary};

/// A read-only libgit2 view with the same Windows long-path support as our Git subprocesses.
/// The override belongs to this handle and never changes existing Git config files.
pub(crate) struct ReadRepository {
    repository: git2::Repository,
    // Fields drop in declaration order: release libgit2 before removing its temporary backend.
    #[cfg(windows)]
    _config_override: TemporaryGitConfig,
}

impl std::ops::Deref for ReadRepository {
    type Target = git2::Repository;

    fn deref(&self) -> &Self::Target {
        &self.repository
    }
}

#[cfg(windows)]
struct TemporaryGitConfig(PathBuf);

#[cfg(windows)]
impl TemporaryGitConfig {
    fn new() -> Result<Self, git2::Error> {
        use std::io::Write;
        let path =
            std::env::temp_dir().join(format!("moonveil-git-{}.config", uuid::Uuid::new_v4()));
        let mut file = std::fs::OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&path)
            .map_err(|error| {
                git2::Error::from_str(&format!("Create temporary Git config: {error}"))
            })?;
        let guard = Self(path);
        file.write_all(b"[core]\nlongpaths = true\n")
            .map_err(|error| {
                git2::Error::from_str(&format!("Write temporary Git config: {error}"))
            })?;
        Ok(guard)
    }
}

#[cfg(windows)]
impl Drop for TemporaryGitConfig {
    fn drop(&mut self) {
        let _ = std::fs::remove_file(&self.0);
    }
}

pub(crate) fn open_repository_for_read(
    path: impl AsRef<Path>,
) -> Result<ReadRepository, git2::Error> {
    let repository = git2::Repository::open(path)?;
    #[cfg(windows)]
    let config_override = {
        // git2 0.20 exposes file-backed config overlays, but no in-memory backend.
        // Attach an app-level temporary backend; preserve all lower-priority values.
        let config_override = TemporaryGitConfig::new()?;
        repository
            .config()?
            .add_file(&config_override.0, git2::ConfigLevel::App, false)?;
        config_override
    };
    Ok(ReadRepository {
        repository,
        #[cfg(windows)]
        _config_override: config_override,
    })
}
fn format_git_error(stdout: &[u8], stderr: &[u8]) -> String {
    let stderr = String::from_utf8_lossy(stderr);
    let stdout = String::from_utf8_lossy(stdout);
    let detail = if stderr.trim().is_empty() {
        stdout.trim()
    } else {
        stderr.trim()
    };
    if detail.is_empty() {
        "Git command failed.".to_string()
    } else {
        detail.to_string()
    }
}

fn git_command(repo_path: &PathBuf) -> Result<tokio::process::Command, String> {
    let git_bin = resolve_git_binary().map_err(|err| format!("Failed to run git: {err}"))?;
    let mut command = tokio_command(git_bin);
    // AppData worktree roots can exceed MAX_PATH with ordinary tracked filenames.
    // Keep this override within the Git process; never rewrite user/repository config.
    #[cfg(windows)]
    command.args(["-c", "core.longpaths=true"]);
    command.current_dir(repo_path).env("PATH", git_env_path());
    Ok(command)
}

pub(crate) async fn run_git_command(repo_path: &PathBuf, args: &[&str]) -> Result<String, String> {
    let output = git_command(repo_path)?
        .args(args)
        .output()
        .await
        .map_err(|err| format!("Failed to run git: {err}"))?;
    if output.status.success() {
        return Ok(String::from_utf8_lossy(&output.stdout).trim().to_string());
    }
    Err(format_git_error(&output.stdout, &output.stderr))
}

pub(crate) async fn run_git_command_owned(
    repo_path: PathBuf,
    args_owned: Vec<String>,
) -> Result<String, String> {
    let arg_refs = args_owned
        .iter()
        .map(|value| value.as_str())
        .collect::<Vec<_>>();
    run_git_command(&repo_path, &arg_refs).await
}

pub(crate) async fn run_git_command_bytes(
    repo_path: &PathBuf,
    args: &[&str],
) -> Result<Vec<u8>, String> {
    let output = git_command(repo_path)?
        .args(args)
        .output()
        .await
        .map_err(|err| format!("Failed to run git: {err}"))?;
    if output.status.success() {
        return Ok(output.stdout);
    }
    Err(format_git_error(&output.stdout, &output.stderr))
}

pub(crate) async fn run_git_diff(repo_path: &PathBuf, args: &[&str]) -> Result<Vec<u8>, String> {
    let output = git_command(repo_path)?
        .args(args)
        .output()
        .await
        .map_err(|err| format!("Failed to run git: {err}"))?;
    if output.status.success() || output.status.code() == Some(1) {
        return Ok(output.stdout);
    }
    Err(format_git_error(&output.stdout, &output.stderr))
}

pub(crate) fn is_missing_worktree_error(error: &str) -> bool {
    error.contains("is not a working tree")
}

pub(crate) async fn git_branch_exists(repo_path: &PathBuf, branch: &str) -> Result<bool, String> {
    let status = git_command(repo_path)?
        .args(["show-ref", "--verify", &format!("refs/heads/{branch}")])
        .status()
        .await
        .map_err(|err| format!("Failed to run git: {err}"))?;
    Ok(status.success())
}

pub(crate) async fn git_remote_exists(repo_path: &PathBuf, remote: &str) -> Result<bool, String> {
    let status = git_command(repo_path)?
        .args(["remote", "get-url", remote])
        .status()
        .await
        .map_err(|err| format!("Failed to run git: {err}"))?;
    Ok(status.success())
}

pub(crate) async fn git_remote_branch_exists_live(
    repo_path: &PathBuf,
    remote: &str,
    branch: &str,
) -> Result<bool, String> {
    let output = git_command(repo_path)?
        .args([
            "ls-remote",
            "--heads",
            remote,
            &format!("refs/heads/{branch}"),
        ])
        .output()
        .await
        .map_err(|err| format!("Failed to run git: {err}"))?;
    if output.status.success() {
        return Ok(!String::from_utf8_lossy(&output.stdout).trim().is_empty());
    }
    Err(format_git_error(&output.stdout, &output.stderr))
}

// Used by daemon-only worktree orchestration paths.
#[allow(dead_code)]
pub(crate) async fn git_remote_branch_exists_local(
    repo_path: &PathBuf,
    remote: &str,
    branch: &str,
) -> Result<bool, String> {
    let status = git_command(repo_path)?
        .args([
            "show-ref",
            "--verify",
            &format!("refs/remotes/{remote}/{branch}"),
        ])
        .status()
        .await
        .map_err(|err| format!("Failed to run git: {err}"))?;
    Ok(status.success())
}

pub(crate) async fn git_list_remotes(repo_path: &PathBuf) -> Result<Vec<String>, String> {
    let output = run_git_command(repo_path, &["remote"]).await?;
    Ok(output
        .lines()
        .map(|line| line.trim())
        .filter(|line| !line.is_empty())
        .map(|line| line.to_string())
        .collect())
}

pub(crate) async fn git_find_remote_for_branch_live(
    repo_path: &PathBuf,
    branch: &str,
) -> Result<Option<String>, String> {
    if git_remote_exists(repo_path, "origin").await?
        && git_remote_branch_exists_live(repo_path, "origin", branch).await?
    {
        return Ok(Some("origin".to_string()));
    }

    for remote in git_list_remotes(repo_path).await? {
        if remote == "origin" {
            continue;
        }
        if git_remote_branch_exists_live(repo_path, &remote, branch).await? {
            return Ok(Some(remote));
        }
    }

    Ok(None)
}

// Used by daemon-only worktree orchestration paths.
#[allow(dead_code)]
pub(crate) async fn git_find_remote_tracking_branch_local(
    repo_path: &PathBuf,
    branch: &str,
) -> Result<Option<String>, String> {
    if git_remote_branch_exists_local(repo_path, "origin", branch).await? {
        return Ok(Some(format!("origin/{branch}")));
    }

    for remote in git_list_remotes(repo_path).await? {
        if remote == "origin" {
            continue;
        }
        if git_remote_branch_exists_local(repo_path, &remote, branch).await? {
            return Ok(Some(format!("{remote}/{branch}")));
        }
    }

    Ok(None)
}

pub(crate) async fn unique_branch_name_live(
    repo_path: &PathBuf,
    desired: &str,
    remote: Option<&str>,
) -> Result<(String, bool), String> {
    let mut candidate = desired.to_string();
    if desired.is_empty() {
        return Ok((candidate, false));
    }
    if !git_branch_exists(repo_path, &candidate).await?
        && match remote {
            Some(remote) => !git_remote_branch_exists_live(repo_path, remote, &candidate).await?,
            None => true,
        }
    {
        return Ok((candidate, false));
    }
    for index in 2..1000 {
        candidate = format!("{desired}-{index}");
        let local_exists = git_branch_exists(repo_path, &candidate).await?;
        let remote_exists = match remote {
            Some(remote) => git_remote_branch_exists_live(repo_path, remote, &candidate).await?,
            None => false,
        };
        if !local_exists && !remote_exists {
            return Ok((candidate, true));
        }
    }
    Err("Unable to find an available branch name.".to_string())
}

pub(crate) async fn git_get_origin_url(repo_path: &PathBuf) -> Option<String> {
    run_git_command(repo_path, &["remote", "get-url", "origin"])
        .await
        .ok()
}

#[cfg(all(test, windows))]
mod windows_tests {
    use super::*;
    use std::fs;

    #[test]
    fn long_path_worktree_operations_do_not_rewrite_git_config() {
        tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .expect("test runtime")
            .block_on(async {
                let fixture = std::env::temp_dir().join(format!("mv-git-{}", uuid::Uuid::new_v4()));
                fs::create_dir_all(&fixture).expect("create fixture directory");
                let repo_path = fixture.join("repo");
                let worktree_path = fixture.join("worktree-".repeat(10));
                let first_dir = "a".repeat(60);
                let second_dir = "b".repeat(60);
                let relative_path = PathBuf::from(&first_dir)
                    .join(&second_dir)
                    .join("long-path.txt");
                let checked_out_file = worktree_path.join(&relative_path);
                assert!(checked_out_file.to_string_lossy().encode_utf16().count() > 260);

                let repo = git2::Repository::init(&repo_path).expect("init fixture repository");
                let mut config = repo.config().expect("fixture config");
                config
                    .set_bool("core.longpaths", false)
                    .expect("disable persistent long paths in fixture");
                config
                    .set_bool("core.autocrlf", false)
                    .expect("fixture line endings");
                let hooks_path = fixture.join("empty-hooks");
                fs::create_dir_all(&hooks_path).expect("empty fixture hooks directory");
                config
                    .set_str("core.hooksPath", hooks_path.to_str().expect("hooks path"))
                    .expect("isolate fixture hooks");
                drop(config);
                {
                    let blob = repo.blob(b"original\n").expect("fixture blob");
                    let mut leaf = repo.treebuilder(None).expect("leaf tree");
                    leaf.insert("long-path.txt", blob, 0o100644)
                        .expect("insert file");
                    let mut middle = repo.treebuilder(None).expect("middle tree");
                    middle
                        .insert(
                            second_dir.as_str(),
                            leaf.write().expect("write leaf"),
                            0o040000,
                        )
                        .expect("insert second directory");
                    let mut root = repo.treebuilder(None).expect("root tree");
                    root.insert(
                        first_dir.as_str(),
                        middle.write().expect("write middle"),
                        0o040000,
                    )
                    .expect("insert first directory");
                    let tree = repo
                        .find_tree(root.write().expect("write root"))
                        .expect("fixture tree");
                    let signature =
                        git2::Signature::now("Test", "test@example.com").expect("signature");
                    repo.commit(Some("HEAD"), &signature, &signature, "fixture", &tree, &[])
                        .expect("fixture commit");
                }
                drop(repo);
                let config_path = repo_path.join(".git").join("config");
                let config_before = fs::read(&config_path).expect("read fixture config");
                let worktree_arg = worktree_path.to_str().expect("worktree path");
                run_git_command(
                    &repo_path,
                    &["worktree", "add", "--detach", worktree_arg, "HEAD"],
                )
                .await
                .expect("checkout long path using process override");
                assert_eq!(
                    fs::read(&checked_out_file).expect("read long path"),
                    b"original\n"
                );
                fs::write(&checked_out_file, b"changed\n").expect("change long path");
                {
                    let view = open_repository_for_read(&worktree_path).expect("open libgit2 view");
                    assert!(view
                        .config()
                        .expect("view config")
                        .get_bool("core.longpaths")
                        .expect("long paths enabled"));
                    let statuses = view.statuses(None).expect("libgit2 long-path status");
                    assert!(statuses.iter().any(|entry| entry
                        .path()
                        .is_some_and(|path| path.ends_with("long-path.txt"))));
                    let diff = view
                        .diff_index_to_workdir(None, None)
                        .expect("libgit2 long-path diff");
                    assert_eq!(diff.deltas().len(), 1);
                    let override_path = view._config_override.0.clone();
                    drop(diff);
                    drop(statuses);
                    drop(view);
                    assert!(
                        !override_path.exists(),
                        "temporary overlay should be removed"
                    );
                }
                let status = run_git_command_bytes(&worktree_path, &["status", "--porcelain"])
                    .await
                    .expect("read long-path worktree status");
                assert!(String::from_utf8_lossy(&status).contains("long-path.txt"));
                let diff = run_git_diff(&worktree_path, &["diff", "--no-ext-diff"])
                    .await
                    .expect("read long-path worktree diff");
                assert!(String::from_utf8_lossy(&diff).contains("+changed"));
                run_git_command(&repo_path, &["worktree", "remove", "--force", worktree_arg])
                    .await
                    .expect("remove long-path fixture worktree");
                assert!(!worktree_path.exists());
                assert_eq!(
                    fs::read(&config_path).expect("read unchanged config"),
                    config_before
                );
                fs::remove_dir_all(&fixture).expect("remove owned fixture directory");
            });
    }
}
