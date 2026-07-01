import { describe, expect, test } from "bun:test";
import { rmSync } from "node:fs";

import { isParallelStage, isSequentialStage, loadConfig } from "./config.js";
import { createTempConfig } from "./test-helpers.js";
import type { ParallelStage, SequentialStage } from "./types.js";

// --- Type guard tests ---

describe("isParallelStage", () => {
  test("returns true for a parallel stage", () => {
    const stage: ParallelStage = { parallel: ["echo hello"] };
    expect(isParallelStage(stage)).toBe(true);
  });

  test("returns false for a sequential stage", () => {
    const stage: SequentialStage = { sequential: ["echo hello"] };
    expect(isParallelStage(stage)).toBe(false);
  });
});

describe("isSequentialStage", () => {
  test("returns true for a sequential stage", () => {
    const stage: SequentialStage = { sequential: ["echo hello"] };
    expect(isSequentialStage(stage)).toBe(true);
  });

  test("returns false for a parallel stage", () => {
    const stage: ParallelStage = { parallel: ["echo hello"] };
    expect(isSequentialStage(stage)).toBe(false);
  });
});

// --- loadConfig tests ---

describe("loadConfig", () => {
  // --- Valid configs ---

  test("loads a config with only check mode", () => {
    const path = createTempConfig(`
check:
  - parallel:
      - echo lint
      - echo test
`);
    const config = loadConfig(path);
    expect(config.check).toHaveLength(1);
    expect(config.check?.[0]).toEqual({ parallel: ["echo lint", "echo test"] });
    expect(config.fix).toBeUndefined();
    rmSync(path, { recursive: true });
  });

  test("loads a config with only fix mode", () => {
    const path = createTempConfig(`
fix:
  - sequential:
      - echo fix
`);
    const config = loadConfig(path);
    expect(config.fix).toHaveLength(1);
    expect(config.fix?.[0]).toEqual({ sequential: ["echo fix"] });
    expect(config.check).toBeUndefined();
    rmSync(path, { recursive: true });
  });

  test("loads a config with both check and fix modes", () => {
    const path = createTempConfig(`
check:
  - parallel:
      - echo lint
fix:
  - sequential:
      - echo fix
  - parallel:
      - echo lint
      - echo test
`);
    const config = loadConfig(path);
    expect(config.check).toHaveLength(1);
    expect(config.fix).toHaveLength(2);
    rmSync(path, { recursive: true });
  });

  test("loads a config with custom mode names", () => {
    const path = createTempConfig(`
lint:
  - parallel:
      - echo eslint
      - echo prettier
deploy:
  - sequential:
      - echo build
      - echo deploy
`);
    const config = loadConfig(path);
    expect(config.lint).toHaveLength(1);
    expect(config.lint?.[0]).toEqual({ parallel: ["echo eslint", "echo prettier"] });
    expect(config.deploy).toHaveLength(1);
    expect(config.deploy?.[0]).toEqual({ sequential: ["echo build", "echo deploy"] });
    rmSync(path, { recursive: true });
  });

  test("loads a config with multiple stages", () => {
    const path = createTempConfig(`
check:
  - sequential:
      - echo step1
  - parallel:
      - echo step2a
      - echo step2b
`);
    const config = loadConfig(path);
    expect(config.check).toHaveLength(2);
    expect(config.check?.[0]).toEqual({ sequential: ["echo step1"] });
    expect(config.check?.[1]).toEqual({ parallel: ["echo step2a", "echo step2b"] });
    rmSync(path, { recursive: true });
  });

  test("loads sequential → parallel → sequential stage order", () => {
    const path = createTempConfig(`
fix:
  - sequential:
      - echo fix
  - parallel:
      - echo lint
      - echo test
  - sequential:
      - echo finalize
`);
    const config = loadConfig(path);
    expect(config.fix).toHaveLength(3);
    expect(config.fix?.[0]).toEqual({ sequential: ["echo fix"] });
    expect(config.fix?.[1]).toEqual({ parallel: ["echo lint", "echo test"] });
    expect(config.fix?.[2]).toEqual({ sequential: ["echo finalize"] });
    rmSync(path, { recursive: true });
  });

  // --- Invalid: file errors ---

  test("throws when config file does not exist", () => {
    expect(() => loadConfig("/nonexistent/path/codesweep.yml")).toThrow("Config file not found");
  });

  // --- Invalid: config structure ---

  test("throws on empty config", () => {
    const path = createTempConfig("");
    expect(() => loadConfig(path)).toThrow("Config file must be an object");
    rmSync(path, { recursive: true });
  });

  test("throws on array config", () => {
    const path = createTempConfig("- item1\n- item2");
    expect(() => loadConfig(path)).toThrow("Config file must be an object");
    rmSync(path, { recursive: true });
  });

  test("throws on empty object config", () => {
    const path = createTempConfig("{}");
    expect(() => loadConfig(path)).toThrow("Config must define at least one mode");
    rmSync(path, { recursive: true });
  });

  // --- Invalid: stage structure ---

  test("throws when stages is not an array", () => {
    const path = createTempConfig(`
check: "not an array"
`);
    expect(() => loadConfig(path)).toThrow("Stage list must be an array");
    rmSync(path, { recursive: true });
  });

  test("throws when stage is not an object", () => {
    const path = createTempConfig(`
check:
  - "not an object"
`);
    expect(() => loadConfig(path)).toThrow("Stage must be an object");
    rmSync(path, { recursive: true });
  });

  test("throws when stage has neither parallel nor sequential", () => {
    const path = createTempConfig(`
check:
  - unknown: ["echo hello"]
`);
    expect(() => loadConfig(path)).toThrow('Stage must have a "parallel" or "sequential" key');
    rmSync(path, { recursive: true });
  });

  test("throws when stage has both parallel and sequential", () => {
    const path = createTempConfig(`
check:
  - parallel:
      - echo a
    sequential:
      - echo b
`);
    expect(() => loadConfig(path)).toThrow('Stage cannot have both "parallel" and "sequential"');
    rmSync(path, { recursive: true });
  });

  // --- Invalid: command lists ---

  test("throws on empty command list", () => {
    const path = createTempConfig(`
check:
  - parallel: []
`);
    expect(() => loadConfig(path)).toThrow("Command list must be a non-empty array");
    rmSync(path, { recursive: true });
  });

  test("throws when command is not a string", () => {
    const path = createTempConfig(`
check:
  - parallel:
      - 123
`);
    expect(() => loadConfig(path)).toThrow("Each command must be a non-empty string");
    rmSync(path, { recursive: true });
  });

  test("throws on empty string command", () => {
    const path = createTempConfig(`
check:
  - parallel:
      - ""
`);
    expect(() => loadConfig(path)).toThrow("Each command must be a non-empty string");
    rmSync(path, { recursive: true });
  });

  test("throws on whitespace-only command", () => {
    const path = createTempConfig(`
check:
  - parallel:
      - "   "
`);
    expect(() => loadConfig(path)).toThrow("Each command must be a non-empty string");
    rmSync(path, { recursive: true });
  });
});
