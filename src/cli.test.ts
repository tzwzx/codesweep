import { afterEach, beforeEach, describe, expect, setDefaultTimeout, spyOn, test } from "bun:test";
import {
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import nodePath from "node:path";
import { pathToFileURL } from "node:url";

import { isEntryPoint, parseCliArgs, runCli } from "./cli.js";
import { createTempConfig } from "./test-helpers.js";

// Each case spawns a full bun subprocess; raise the timeout above Bun's
// 5000ms default so a slow process spawn under heavy load does not flake.
setDefaultTimeout(20_000);

const CLI_PATH = nodePath.resolve(import.meta.dirname, "cli.ts");

/** Run the CLI as a subprocess and capture output */
const runCliProcess = async (
  args: string[],
  cwd?: string,
): Promise<{ stdout: string; stderr: string; exitCode: number }> => {
  const proc = Bun.spawn(["bun", "run", CLI_PATH, ...args], {
    cwd,
    stderr: "pipe",
    stdout: "pipe",
  });
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  const exitCode = await proc.exited;
  return { exitCode, stderr, stdout };
};

describe("isEntryPoint", () => {
  test("returns true when the entry path matches the module URL", () => {
    // realpathSync mirrors Node, which resolves import.meta.url to the real
    // path (tmpdir itself is a symlink on macOS: /var -> /private/var).
    const dir = realpathSync(mkdtempSync(nodePath.join(tmpdir(), "codesweep-entry-")));
    const realPath = nodePath.join(dir, "cli.js");
    writeFileSync(realPath, "");
    expect(isEntryPoint(realPath, pathToFileURL(realPath).href)).toBe(true);
    rmSync(dir, { recursive: true });
  });

  test("returns true when the entry is a symlink to the module (npm bin shim)", () => {
    // Node resolves import.meta.url to the real path, while process.argv[1]
    // keeps the symlink path (e.g. node_modules/.bin/codesweep).
    const dir = realpathSync(mkdtempSync(nodePath.join(tmpdir(), "codesweep-entry-")));
    const realPath = nodePath.join(dir, "cli.js");
    const linkPath = nodePath.join(dir, "bin-shim");
    writeFileSync(realPath, "");
    symlinkSync(realPath, linkPath);
    expect(isEntryPoint(linkPath, pathToFileURL(realPath).href)).toBe(true);
    rmSync(dir, { recursive: true });
  });

  test("returns false when the entry is a different module", () => {
    const dir = realpathSync(mkdtempSync(nodePath.join(tmpdir(), "codesweep-entry-")));
    const realPath = nodePath.join(dir, "cli.js");
    const otherPath = nodePath.join(dir, "other.js");
    writeFileSync(realPath, "");
    writeFileSync(otherPath, "");
    expect(isEntryPoint(otherPath, pathToFileURL(realPath).href)).toBe(false);
    rmSync(dir, { recursive: true });
  });

  test("returns false when the entry is undefined", () => {
    expect(isEntryPoint(undefined, import.meta.url)).toBe(false);
  });

  test("falls back to a plain path comparison when the entry does not exist", () => {
    const missing = nodePath.join(tmpdir(), "codesweep-entry-missing", "cli.js");
    expect(isEntryPoint(missing, pathToFileURL(missing).href)).toBe(true);
  });
});

describe("parseCliArgs", () => {
  test("parses mode, config, and help flags", () => {
    expect(parseCliArgs(["check", "--config", "./x.yml"])).toEqual({
      config: "./x.yml",
      help: false,
      mode: "check",
    });
    expect(parseCliArgs(["-h"])).toEqual({ config: undefined, help: true, mode: undefined });
  });

  test("throws on invalid option syntax", () => {
    expect(() => parseCliArgs(["check", "--config"])).toThrow("--config");
  });
});

describe("runCli", () => {
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

  test("prints help and returns 0 for --help", async () => {
    await expect(runCli({ help: true })).resolves.toBe(0);
    expect(consoleLogSpy.mock.calls.flat().join(" ")).toContain("codesweep");
  });

  test("prints help and returns 1 when mode is missing", async () => {
    await expect(runCli({ help: false })).resolves.toBe(1);
  });

  test("runs a mode and returns 0 on success", async () => {
    const path = createTempConfig(`
check:
  - sequential:
      - echo ok
`);
    await expect(runCli({ config: path, help: false, mode: "check" })).resolves.toBe(0);
    rmSync(path, { recursive: true });
  });

  test("returns 1 when the mode fails", async () => {
    const path = createTempConfig(`
check:
  - sequential:
      - exit 1
`);
    await expect(runCli({ config: path, help: false, mode: "check" })).resolves.toBe(1);
    expect(consoleErrorSpy.mock.calls.length).toBeGreaterThan(0);
    rmSync(path, { recursive: true });
  });
});

describe("CLI", () => {
  // --- Help display ---

  test("--help shows help and exits with code 0", async () => {
    const result = await runCliProcess(["--help"]);
    expect(result.stdout).toContain("codesweep");
    expect(result.stdout).toContain("check");
    expect(result.stdout).toContain("fix");
    expect(result.exitCode).toBe(0);
  });

  test("-h shows help", async () => {
    const result = await runCliProcess(["-h"]);
    expect(result.stdout).toContain("codesweep");
    expect(result.exitCode).toBe(0);
  });

  // --- No mode specified ---

  test("shows help and exits with code 1 when no mode is given", async () => {
    const result = await runCliProcess([]);
    expect(result.stdout).toContain("codesweep");
    expect(result.exitCode).toBe(1);
  });

  // --- Undefined mode ---

  test("shows error and exits with code 1 for undefined mode", async () => {
    const path = createTempConfig(`
check:
  - sequential:
      - echo ok
`);
    const result = await runCliProcess(["nonexistent", "-c", path]);
    expect(result.stderr).toContain('Mode "nonexistent" is not defined');
    expect(result.exitCode).toBe(1);
    rmSync(path, { recursive: true });
  });

  // --- --config option ---

  test("accepts custom config path with --config", async () => {
    const path = createTempConfig(`
check:
  - sequential:
      - echo ok
`);
    const result = await runCliProcess(["check", "--config", path]);
    expect(result.exitCode).toBe(0);
    rmSync(path, { recursive: true });
  });

  test("accepts custom config path with -c", async () => {
    const path = createTempConfig(`
check:
  - sequential:
      - echo ok
`);
    const result = await runCliProcess(["check", "-c", path]);
    expect(result.exitCode).toBe(0);
    rmSync(path, { recursive: true });
  });

  test("exits with code 1 when --config has no path", async () => {
    const result = await runCliProcess(["check", "--config"]);
    expect(result.stderr).toContain("--config");
    expect(result.exitCode).toBe(1);
  });

  // --- Successful execution ---

  test("exits with code 0 on successful check", async () => {
    const path = createTempConfig(`
check:
  - sequential:
      - echo hello
`);
    const result = await runCliProcess(["check", "-c", path]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("codesweep check passed");
    rmSync(path, { recursive: true });
  });

  test("exits with code 0 on successful fix", async () => {
    const path = createTempConfig(`
fix:
  - sequential:
      - echo fixed
`);
    const result = await runCliProcess(["fix", "-c", path]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("codesweep fix passed");
    rmSync(path, { recursive: true });
  });

  // --- Custom modes ---

  test("runs a custom mode name", async () => {
    const path = createTempConfig(`
lint:
  - sequential:
      - echo linting
`);
    const result = await runCliProcess(["lint", "-c", path]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("codesweep lint passed");
    rmSync(path, { recursive: true });
  });

  // --- Failure ---

  test("exits with code 1 on command failure", async () => {
    const path = createTempConfig(`
check:
  - sequential:
      - exit 1
`);
    const result = await runCliProcess(["check", "-c", path]);
    expect(result.exitCode).toBe(1);
    rmSync(path, { recursive: true });
  });

  // --- init subcommand ---

  test("init creates codesweep.yml in the current directory", async () => {
    const dir = mkdtempSync(nodePath.join(tmpdir(), "codesweep-cli-init-"));
    const result = await runCliProcess(["init"], dir);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Created");
    expect(readFileSync(nodePath.join(dir, "codesweep.yml"), "utf-8")).toContain("check:");
    rmSync(dir, { recursive: true });
  });

  test("init creates a config file at the path given by --config", async () => {
    const dir = mkdtempSync(nodePath.join(tmpdir(), "codesweep-cli-init-"));
    const target = nodePath.join(dir, "custom.yml");
    const result = await runCliProcess(["init", "--config", target]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain(target);
    expect(readFileSync(target, "utf-8")).toContain("fix:");
    rmSync(dir, { recursive: true });
  });

  test("init fails when the config file already exists", async () => {
    const path = createTempConfig(`
check:
  - sequential:
      - echo ok
`);
    const result = await runCliProcess(["init", "-c", path]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Config file already exists");
    rmSync(path, { recursive: true });
  });

  test("init is reserved even when the config defines an init mode", async () => {
    const path = createTempConfig(`
init:
  - sequential:
      - echo should not run
`);
    const result = await runCliProcess(["init", "-c", path]);
    // The subcommand takes precedence, so it reports the existing file
    // instead of running the user-defined "init" mode.
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Config file already exists");
    expect(result.stdout).not.toContain("should not run");
    rmSync(path, { recursive: true });
  });

  test("--help mentions the init subcommand", async () => {
    const result = await runCliProcess(["--help"]);
    expect(result.stdout).toContain("Create a starter codesweep.yml");
    expect(result.exitCode).toBe(0);
  });
});
