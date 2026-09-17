// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { APP_UPDATES_AVAILABLE } from "../updateAvailability";
import { STORAGE_KEY_PENDING_POST_UPDATE_VERSION } from "../utils/postUpdateRelease";
import { useUpdater } from "./useUpdater";

vi.mock("@tauri-apps/api/core", () => ({ isTauri: () => true }));
vi.mock("@tauri-apps/plugin-updater", () => ({ check: vi.fn() }));
vi.mock("@tauri-apps/plugin-process", () => ({ relaunch: vi.fn() }));

beforeEach(() => { vi.clearAllMocks(); window.localStorage.clear(); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("Moonveil updater availability", () => {
  it("blocks automatic/manual checks and installs without a configured feed", async () => {
    expect(APP_UPDATES_AVAILABLE).toBe(false);
    vi.stubEnv("DEV", false);
    const { result } = renderHook(() => useUpdater({ enabled: true, autoCheckOnMount: true }));
    await act(async () => {
      await result.current.checkForUpdates({ announceNoUpdate: true });
      await result.current.startUpdate();
    });
    expect(check).not.toHaveBeenCalled();
    expect(relaunch).not.toHaveBeenCalled();
    expect(result.current.state.stage).toBe("idle");
  });

  it("does not fetch upstream release notes from saved updater state", () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    window.localStorage.setItem(STORAGE_KEY_PENDING_POST_UPDATE_VERSION, __APP_VERSION__);
    const { result } = renderHook(() => useUpdater({ enabled: true }));
    expect(fetch).not.toHaveBeenCalled();
    expect(result.current.postUpdateNotice).toBe(null);
  });
});
