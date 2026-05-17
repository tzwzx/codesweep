import { afterEach, beforeEach, describe, expect, setDefaultTimeout, spyOn, test } from "bun:test";
import { rmSync } from "node:fs";

import { codesweep } from "./index.js";
import { createTempConfig } from "./test-helpers.js";

// codesweep() spawns real OS subprocesses; raise the timeout above Bun's
// 5000ms default so a slow process spawn under heavy load does not flake.
setDefaultTimeout(20_000);

describe("codesweep", () => {
  let consoleLogSpy: ReturnType<typeof spyOn>;
  let consoleErrorSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    consoleLogSpy = spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  test("completes pipeline with a successful command", async () => {
    const path = createTempConfig(`
check:
  - sequential:
      - echo hello
`);
    await codesweep("check", path);

    const logCalls = consoleLogSpy.mock.calls.flat().join(" ");
    expect(logCalls).toContain("codesweep check passed");
    rmSync(path, { recursive: true });
  });

  test("executes multiple stages in order", async () => {
    const path = createTempConfig(`
check:
  - sequential:
      - echo stage1
  - sequential:
      - echo stage2
`);
    await codesweep("check", path);

    const logCalls = consoleLogSpy.mock.calls.flat().join(" ");
    expect(logCalls).toContain("codesweep check passed");
    rmSync(path, { recursive: true });
  });

  test("executes parallel stage successfully", async () => {
    const path = createTempConfig(`
check:
  - parallel:
      - "true"
      - "true"
`);
    await codesweep("check", path);

    const logCalls = consoleLogSpy.mock.calls.flat().join(" ");
    expect(logCalls).toContain("codesweep check passed");
    rmSync(path, { recursive: true });
  });

  test("throws when mode is not defined in config", async () => {
    const path = createTempConfig(`
check:
  - sequential:
      - echo hello
`);
    await expect(codesweep("fix", path)).rejects.toThrow(
      'Mode "fix" is not defined in the config file (available: check)',
    );
    rmSync(path, { recursive: true });
  });

  test("throws when a command fails", async () => {
    const path = createTempConfig(`
check:
  - sequential:
      - exit 1
`);
    await expect(codesweep("check", path)).rejects.toThrow();

    const errorCalls = consoleErrorSpy.mock.calls.flat().join(" ");
    expect(errorCalls).toContain("codesweep check failed");
    rmSync(path, { recursive: true });
  });

  test("includes elapsed time in output", async () => {
    const path = createTempConfig(`
fix:
  - sequential:
      - echo done
`);
    await codesweep("fix", path);

    const logCalls = consoleLogSpy.mock.calls.flat().join(" ");
    expect(logCalls).toMatch(/\d+\.\d+s/u);
    rmSync(path, { recursive: true });
  });
});
