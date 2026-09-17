#[cfg(target_os = "windows")]
use std::env;
use std::ffi::OsStr;
#[cfg(target_os = "windows")]
use std::path::{Path, PathBuf};
#[cfg(windows)]
use std::process::Stdio;

use tokio::process::{Child, Command};

/// On Windows, spawning a console app from a GUI subsystem app will open a new
/// console window unless we explicitly disable it.
fn hide_console_on_windows(_command: &mut std::process::Command) {
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        _command.creation_flags(CREATE_NO_WINDOW);
    }
}

pub(crate) fn tokio_command(program: impl AsRef<OsStr>) -> Command {
    let mut command = Command::new(program);
    hide_console_on_windows(command.as_std_mut());
    command
}

pub(crate) fn std_command(program: impl AsRef<OsStr>) -> std::process::Command {
    let mut command = std::process::Command::new(program);
    hide_console_on_windows(&mut command);
    command
}

pub(crate) async fn kill_child_process_tree(child: &mut Child) {
    #[cfg(windows)]
    {
        if let Some(pid) = child.id() {
            let _ = tokio_command("taskkill")
                .arg("/PID")
                .arg(pid.to_string())
                .arg("/T")
                .arg("/F")
                .stdout(Stdio::null())
                .stderr(Stdio::null())
                .status()
                .await;
        }
    }

    let _ = child.kill().await;
}

#[cfg(target_os = "windows")]
pub(crate) fn resolve_windows_executable(program: &str, path_env: Option<&str>) -> Option<PathBuf> {
    let trimmed = program.trim();
    if trimmed.is_empty() {
        return None;
    }

    let program = trimmed
        .strip_prefix('"')
        .and_then(|value| value.strip_suffix('"'))
        .unwrap_or(trimmed)
        .trim();

    if program.is_empty() {
        return None;
    }

    let has_separators = program.contains('\\') || program.contains('/');
    let has_drive = matches!(program.as_bytes().get(1), Some(b':'));
    let looks_like_path = has_separators || has_drive;

    let path_candidates = if Path::new(program).extension().is_some() {
        vec![program.to_string()]
    } else {
        vec![
            format!("{program}.exe"),
            format!("{program}.cmd"),
            format!("{program}.bat"),
            format!("{program}.com"),
        ]
    };

    if looks_like_path {
        for candidate in path_candidates {
            let path = PathBuf::from(candidate);
            if path.is_file() {
                return Some(path);
            }
        }
        return None;
    }

    let paths: Vec<PathBuf> = if let Some(value) = path_env {
        let trimmed = value.trim();
        if trimmed.is_empty() {
            Vec::new()
        } else {
            env::split_paths(trimmed).collect()
        }
    } else {
        env::var_os("PATH")
            .map(|value| env::split_paths(&value).collect())
            .unwrap_or_default()
    };

    for root in paths {
        for candidate in &path_candidates {
            let path = root.join(candidate);
            if path.is_file() {
                return Some(path);
            }
        }
    }

    None
}

/// Resolve Codex to a native executable before crossing the process boundary.
/// npm's wrapper is only a location hint: its contents are never evaluated.
#[cfg(target_os = "windows")]
pub(crate) fn resolve_windows_codex_executable(
    program: &str,
    path_env: Option<&str>,
) -> Result<PathBuf, String> {
    let trimmed = program.trim();
    let program = trimmed
        .strip_prefix('"')
        .and_then(|value| value.strip_suffix('"'))
        .unwrap_or(trimmed);
    if program.is_empty() || program.chars().any(|ch| ch.is_control() || ch == '"') {
        return Err("Select a native Codex executable, not a shell command.".into());
    }
    let requested = Path::new(program);
    let has_path = program.contains(['\\', '/']) || program.contains(':');
    if has_path && !requested.is_absolute() {
        return Err("The Codex executable path must be absolute.".into());
    }
    let extension = requested.extension().and_then(|value| value.to_str());
    let is_wrapper = extension
        .is_some_and(|ext| ext.eq_ignore_ascii_case("cmd") || ext.eq_ignore_ascii_case("bat"));
    if extension.is_some_and(|ext| !ext.eq_ignore_ascii_case("exe")) && !is_wrapper {
        return Err("On Windows, select the native codex.exe executable.".into());
    }
    let is_codex = requested
        .file_stem()
        .and_then(|value| value.to_str())
        .is_some_and(|name| name.eq_ignore_ascii_case("codex"));
    if is_wrapper && !is_codex {
        return Err(
            "Shell wrappers are not executed. Select the native codex.exe executable.".into(),
        );
    }
    let roots = if has_path {
        vec![requested
            .parent()
            .ok_or("Codex executable has no parent directory")?
            .to_path_buf()]
    } else {
        path_env
            .map(|value| env::split_paths(value).collect::<Vec<_>>())
            .or_else(|| env::var_os("PATH").map(|value| env::split_paths(&value).collect()))
            .unwrap_or_default()
    };
    for root in roots.into_iter().filter(|root| root.is_absolute()) {
        let mut candidates = Vec::new();
        if !is_wrapper {
            candidates.push(if has_path {
                requested.with_extension("exe")
            } else {
                root.join(requested).with_extension("exe")
            });
        }
        if is_codex && (!has_path || is_wrapper) {
            candidates.extend(windows_npm_codex_candidates(&root));
        }
        for candidate in candidates {
            if candidate.is_file() {
                return std::fs::canonicalize(&candidate)
                    .map_err(|error| format!("Could not resolve Codex executable: {error}"));
            }
        }
    }
    Err("Native Codex CLI not found. Install Codex on PATH or select codex.exe in Settings. npm shell wrappers require the installed native @openai/codex Windows package.".into())
}

#[cfg(target_os = "windows")]
fn windows_npm_codex_candidates(root: &Path) -> Vec<PathBuf> {
    let (package, target) = if cfg!(target_arch = "aarch64") {
        ("codex-win32-arm64", "aarch64-pc-windows-msvc")
    } else {
        ("codex-win32-x64", "x86_64-pc-windows-msvc")
    };
    let package_root = root.join("node_modules/@openai/codex");
    // Official npm installs may hoist their optional platform package, nest it
    // below @openai/codex, or use the package's vendor fallback (codex-cli/bin/codex.js).
    [
        root.join("node_modules/@openai").join(package),
        package_root.join("node_modules/@openai").join(package),
        package_root,
    ]
    .into_iter()
    .map(|base| base.join("vendor").join(target).join("bin/codex.exe"))
    .collect()
}

#[cfg(target_os = "windows")]
fn quote_cmd_token(value: &str) -> Result<String, String> {
    // cmd's batch reparsing cannot safely preserve arbitrary quote/expansion
    // syntax. Keep editor-wrapper support only for plain literal tokens.
    if value
        .chars()
        .any(|ch| ch.is_control() || matches!(ch, '"' | '%' | '!' | '^' | '&' | '|' | '<' | '>'))
    {
        return Err("This Windows shell wrapper cannot accept command syntax in its path or arguments. Configure the native executable instead.".into());
    }
    Ok(format!("\"{value}\""))
}

/// Build a batch-wrapper command only from validated, literal tokens.
/// Codex itself is always launched through its native executable instead.
#[cfg(target_os = "windows")]
pub(crate) fn build_cmd_c_command(program: &Path, args: &[String]) -> Result<String, String> {
    let program_str = program.to_string_lossy();
    let mut parts: Vec<String> = Vec::with_capacity(args.len() + 1);
    parts.push(quote_cmd_token(program_str.as_ref())?);
    for arg in args {
        parts.push(quote_cmd_token(arg)?);
    }
    Ok(format!("\"{}\"", parts.join(" ")))
}

#[cfg(all(test, target_os = "windows"))]
mod tests {
    use super::*;

    fn fixture_root() -> PathBuf {
        let root = env::temp_dir().join(format!("moonveil-executable-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&root).unwrap();
        root
    }

    #[test]
    fn resolves_native_codex_and_quoted_manual_path() {
        let root = fixture_root();
        let bin = root.join("codex.exe");
        std::fs::write(&bin, b"test fixture, never executed").unwrap();
        let expected = std::fs::canonicalize(&bin).unwrap();
        assert_eq!(
            resolve_windows_codex_executable("codex", root.to_str()).unwrap(),
            expected
        );
        assert_eq!(
            resolve_windows_codex_executable(&format!("\"{}\"", bin.display()), None).unwrap(),
            expected
        );
        std::fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn resolves_npm_native_package_without_executing_wrapper() {
        let root = fixture_root();
        let wrapper = root.join("codex.cmd");
        std::fs::write(&wrapper, b"@echo malicious wrapper must never execute").unwrap();
        for native in windows_npm_codex_candidates(&root) {
            std::fs::create_dir_all(native.parent().unwrap()).unwrap();
            std::fs::write(&native, b"native fixture, never executed").unwrap();
            let expected = std::fs::canonicalize(&native).unwrap();
            assert_eq!(
                resolve_windows_codex_executable(wrapper.to_str().unwrap(), None).unwrap(),
                expected
            );
            assert_eq!(
                resolve_windows_codex_executable("codex", root.to_str()).unwrap(),
                expected
            );
            std::fs::remove_file(native).unwrap();
        }
        assert!(resolve_windows_codex_executable(wrapper.to_str().unwrap(), None).is_err());
        std::fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn rejects_relative_paths_scripts_and_command_text() {
        for value in [
            ".\\codex.exe",
            "codex.ps1",
            "shell.bat",
            "codex\n.exe",
            "codex.exe\" & echo injected",
        ] {
            assert!(
                resolve_windows_codex_executable(value, Some("")).is_err(),
                "{value:?}"
            );
        }
    }

    #[test]
    fn wrapper_tokens_fail_closed_for_shell_syntax() {
        for value in [
            "a\" & echo injected",
            "%PATH%",
            "!NAME!",
            "a^b",
            "a&b",
            "a|b",
            "a>b",
            "a<b",
            "a\nb",
            "a\rb",
            "a\0b",
        ] {
            assert!(
                build_cmd_c_command(Path::new(r"C:\tools\editor.cmd"), &[value.into()]).is_err(),
                "{value:?}"
            );
        }
        assert!(build_cmd_c_command(
            Path::new(r"C:\tools\editor.cmd"),
            &[r"C:\My Project\file.ts".into()]
        )
        .is_ok());
    }
}
