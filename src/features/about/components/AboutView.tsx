import { useEffect, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";

const MOONVEIL_URL = "https://github.com/Snickers1993/Testfork/tree/Module-1";
const UPSTREAM_URL = "https://github.com/Dimillian/CodexMonitor";

export function AboutView() {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getVersion().then((value) => active && setVersion(value)).catch(() => active && setVersion(null));
    return () => { active = false; };
  }, []);

  return (
    <div className="about">
      <div className="about-card">
        <div className="about-header">
          <img className="about-icon" src="/moonveil/moonvale-emblem.svg" alt="Moonveil emblem" />
          <div className="about-title">Moonveil</div>
        </div>
        <div className="about-version">{version ? `Version ${version}` : "Version —"}</div>
        <div className="about-tagline">A personal Codex workstation with a magical guild.</div>
        <div className="about-divider" />
        <div className="about-links">
          <button type="button" className="about-link" onClick={() => void openUrl(MOONVEIL_URL)}>Moonveil source</button>
          <span className="about-link-sep">|</span>
          <button type="button" className="about-link" onClick={() => void openUrl(UPSTREAM_URL)}>CodexMonitor upstream</button>
        </div>
        <div className="about-footer">Built on CodexMonitor. Codex remains the execution and security authority.</div>
      </div>
    </div>
  );
}
