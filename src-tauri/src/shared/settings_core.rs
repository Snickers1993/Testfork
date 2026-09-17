use std::path::PathBuf;

use tokio::sync::Mutex;

use crate::codex::config as codex_config;
use crate::storage::write_settings;
use crate::types::AppSettings;
use crate::utils::normalize_windows_namespace_path;

fn normalize_personality(value: &str) -> Option<&'static str> {
    match value.trim() {
        "friendly" => Some("friendly"),
        "pragmatic" => Some("pragmatic"),
        _ => None,
    }
}

pub(crate) async fn get_app_settings_core(app_settings: &Mutex<AppSettings>) -> AppSettings {
    let mut settings = app_settings.lock().await.clone();
    if let Ok(Some(collaboration_modes_enabled)) = codex_config::read_collaboration_modes_enabled()
    {
        settings.collaboration_modes_enabled = collaboration_modes_enabled;
    }
    if let Ok(Some(steer_enabled)) = codex_config::read_steer_enabled() {
        settings.steer_enabled = steer_enabled;
    }
    if let Ok(Some(unified_exec_enabled)) = codex_config::read_unified_exec_enabled() {
        settings.unified_exec_enabled = unified_exec_enabled;
    }
    if let Ok(Some(apps_enabled)) = codex_config::read_apps_enabled() {
        settings.experimental_apps_enabled = apps_enabled;
    }
    settings.personality = normalize_personality(&settings.personality)
        .unwrap_or("friendly")
        .to_string();
    settings
}

pub(crate) async fn update_app_settings_core(
    mut settings: AppSettings,
    app_settings: &Mutex<AppSettings>,
    settings_path: &PathBuf,
) -> Result<AppSettings, String> {
    settings.global_worktrees_folder = settings
        .global_worktrees_folder
        .map(|path| normalize_windows_namespace_path(&path));
    // Appearance, companion, and other Moonveil preferences must never rewrite
    // shared Codex configuration. Explicit feature/config editor commands own
    // shared configuration writes; personality is applied at thread/start.
    settings.personality = normalize_personality(&settings.personality)
        .unwrap_or("friendly")
        .to_string();
    write_settings(settings_path, &settings)?;
    let mut current = app_settings.lock().await;
    *current = settings.clone();
    Ok(settings)
}

pub(crate) fn get_codex_config_path_core() -> Result<String, String> {
    codex_config::config_toml_path()
        .ok_or_else(|| "Unable to resolve CODEX_HOME".to_string())
        .and_then(|path| {
            path.to_str()
                .map(|value| value.to_string())
                .ok_or_else(|| "Unable to resolve CODEX_HOME".to_string())
        })
}

#[cfg(test)]
mod tests {
    use super::*;

    // Run the real save path in a child with an isolated Codex home. This avoids
    // mutating process-wide environment while other Rust tests run in parallel.
    #[test]
    fn settings_save_preserves_shared_codex_configuration() {
        const CHILD_HOME: &str = "MOONVEIL_SETTINGS_TEST_HOME";
        if let Some(root) = std::env::var_os(CHILD_HOME) {
            let root = PathBuf::from(root);
            let config_path = root.join("config.toml");
            let before = std::fs::read(&config_path).unwrap();
            tokio::runtime::Runtime::new().unwrap().block_on(async {
                let state = Mutex::new(AppSettings::default());
                let mut changed = AppSettings::default();
                changed.theme = "dark".into();
                changed.personality = "pragmatic".into();
                changed.unified_exec_enabled = false;
                let result =
                    update_app_settings_core(changed, &state, &root.join("moonveil/settings.json"))
                        .await
                        .unwrap();
                assert_eq!(result.personality, "pragmatic");
                assert_eq!(get_app_settings_core(&state).await.personality, "pragmatic");
            });
            assert_eq!(std::fs::read(config_path).unwrap(), before);
            assert!(!root.join("AGENTS.md").exists());
            assert!(!root.join("auth.json").exists());
            return;
        }
        let root = std::env::temp_dir().join(format!("moonveil-settings-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(root.join("moonveil")).unwrap();
        std::fs::write(root.join("config.toml"), "# shared client settings\npersonality = \"friendly\"\n[features]\nunified_exec = true\n").unwrap();
        let output = crate::shared::process_core::std_command(std::env::current_exe().unwrap())
            .args([
                "--exact",
                "shared::settings_core::tests::settings_save_preserves_shared_codex_configuration",
                "--nocapture",
            ])
            .env(CHILD_HOME, &root)
            .env("CODEX_HOME", &root)
            .output()
            .unwrap();
        std::fs::remove_dir_all(root).unwrap();
        assert!(
            output.status.success(),
            "settings child failed: {} {}",
            String::from_utf8_lossy(&output.stdout),
            String::from_utf8_lossy(&output.stderr)
        );
        assert!(String::from_utf8_lossy(&output.stdout).contains("1 passed"));
    }
}
