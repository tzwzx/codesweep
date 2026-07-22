import { afterEach, beforeEach, describe, expect, setDefaultTimeout, spyOn, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import nodePath from "node:path";

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

  describe("quiet", () => {
    test("prints nothing when every command passes", async () => {
      const path = createTempConfig(`
check:
  - sequential:
      - echo from-sequential
  - parallel:
      - echo from-parallel
      - echo also-parallel
`);
      await codesweep("check", path, { quiet: true });

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      rmSync(path, { recursive: true });
    });

    test("prints the output of a failing command only", async () => {
      const path = createTempConfig(`
check:
  - parallel:
      - echo passing-noise
      - sh -c 'echo failing-detail; exit 1'
`);
      await expect(codesweep("check", path, { quiet: true })).rejects.toThrow();

      const output = [...consoleLogSpy.mock.calls, ...consoleErrorSpy.mock.calls].flat().join(" ");
      expect(output).toContain("failing-detail");
      expect(output).not.toContain("passing-noise");
      rmSync(path, { recursive: true });
    });

    test("still runs every parallel command when one fails", async () => {
      const markerDir = mkdtempSync(nodePath.join(tmpdir(), "codesweep-quiet-"));
      const marker = nodePath.join(markerDir, "ran.txt");
      const configPath = createTempConfig(`
check:
  - parallel:
      - exit 1
      - sh -c 'echo ran >> ${marker}'
`);
      await expect(codesweep("check", configPath, { quiet: true })).rejects.toThrow();

      expect(readFileSync(marker, "utf-8")).toContain("ran");
      rmSync(configPath, { recursive: true });
    });
  });
});
