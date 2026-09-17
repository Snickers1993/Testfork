import tauriConfig from "../../../src-tauri/tauri.conf.json";

// Module 1 has no release feed. All callers, including About and menu actions,
// must honor the packaged configuration rather than desktop detection alone.
export const APP_UPDATES_AVAILABLE = tauriConfig.plugins.updater.endpoints.length > 0;
