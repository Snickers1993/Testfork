/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sentryInitMock = vi.fn();
const sentryMetricsCountMock = vi.fn();
const renderMock = vi.fn();
const createRootMock = vi.fn(() => ({
  render: renderMock,
}));

vi.mock("@sentry/react", () => ({
  init: sentryInitMock,
  metrics: {
    count: sentryMetricsCountMock,
  },
}));

vi.mock("react-dom/client", () => ({
  default: {
    createRoot: createRootMock,
  },
  createRoot: createRootMock,
}));

vi.mock("./App", () => ({
  default: () => null,
}));

describe("Moonveil telemetry bootstrap", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("VITE_SENTRY_DSN", "");
    sentryInitMock.mockClear();
    sentryMetricsCountMock.mockClear();
    createRootMock.mockClear();
    renderMock.mockClear();
    document.body.innerHTML = '<div id="root"></div>';
  });
  afterEach(() => vi.unstubAllEnvs());

  it("starts without initializing or sending inherited telemetry", async () => {
    await import("./main");
    expect(sentryInitMock).not.toHaveBeenCalled();
    expect(sentryMetricsCountMock).not.toHaveBeenCalled();
    expect(renderMock).toHaveBeenCalledTimes(1);
  });

  it("uses only an explicitly configured telemetry endpoint", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", "https://public@example.invalid/1");
    await import("./main");
    expect(sentryInitMock).toHaveBeenCalledExactlyOnceWith({
      dsn: "https://public@example.invalid/1",
      enabled: true,
      release: expect.any(String),
    });
    expect(sentryMetricsCountMock).toHaveBeenCalledExactlyOnceWith(
      "app_open", 1, { attributes: { env: import.meta.env.MODE } },
    );
  });
});
