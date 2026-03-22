import { describe, expect, test } from "bun:test";
import { rmSync } from "node:fs";
import { resolve } from "node:path";

import { createTempConfig } from "./test-helpers.js";

const CLI_PATH = resolve(import.meta.dirname, "cli.ts");

/** Run the CLI as a subprocess and capture output */
const runCli = async (
  args: string[],
): Promise<{ stdout: string; stderr: string; exitCode: number }> => {
  const proc = Bun.spawn(["bun", "run", CLI_PATH, ...args], {
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

describe("CLI", () => {
  // --- Help display ---

  test("--help shows help and exits with code 0", async () => {
    const result = await runCli(["--help"]);
    expect(result.stdout).toContain("codesweep");
    expect(result.stdout).toContain("check");
    expect(result.stdout).toContain("fix");
    expect(result.exitCode).toBe(0);
  });

  test("-h shows help", async () => {
    const result = await runCli(["-h"]);
    expect(result.stdout).toContain("codesweep");
    expect(result.exitCode).toBe(0);
  });

  // --- No mode specified ---

  test("shows help and exits with code 1 when no mode is given", async () => {
    const result = await runCli([]);
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
    const result = await runCli(["nonexistent", "-c", path]);
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
    const result = await runCli(["check", "--config", path]);
    expect(result.exitCode).toBe(0);
    rmSync(path, { recursive: true });
  });

  test("accepts custom config path with -c", async () => {
    const path = createTempConfig(`
check:
  - sequential:
      - echo ok
`);
    const result = await runCli(["check", "-c", path]);
    expect(result.exitCode).toBe(0);
    rmSync(path, { recursive: true });
  });

  test("exits with code 1 when --config has no path", async () => {
    const result = await runCli(["check", "--config"]);
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
    const result = await runCli(["check", "-c", path]);
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
    const result = await runCli(["fix", "-c", path]);
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
    const result = await runCli(["lint", "-c", path]);
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
    const result = await runCli(["check", "-c", path]);
    expect(result.exitCode).toBe(1);
    rmSync(path, { recursive: true });
  });
});
