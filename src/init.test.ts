import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { loadConfig } from "./config.js";
import { initConfig } from "./init.js";

/** Create an empty temporary directory for init tests */
const createTempDir = (): string => mkdtempSync(path.join(tmpdir(), "codesweep-init-test-"));

describe("initConfig", () => {
  test("creates a config file at the given path and returns the absolute path", () => {
    const dir = createTempDir();
    const target = path.join(dir, "codesweep.yml");

    const createdPath = initConfig(target);

    expect(createdPath).toBe(target);
    expect(readFileSync(target, "utf-8")).toContain("check:");
    rmSync(dir, { recursive: true });
  });

  test("generated template matches the exact expected content", () => {
    const dir = createTempDir();
    const target = path.join(dir, "codesweep.yml");

    initConfig(target);

    // Byte-for-byte copy of CONFIG_TEMPLATE in src/init.ts. This catches
    // any accidental drift in the template text that a loose `toContain`
    // check would miss.
    expect(readFileSync(target, "utf-8")).toBe(`# codesweep configuration
# https://github.com/tzwzx/codesweep

check:
  - parallel: # Stage 1: run checks in parallel
      - npm run lint
      - npm run typecheck
      - npm test

fix:
  - sequential: # Stage 1: apply auto-fixes
      - npm run fix
  - parallel: # Stage 2: verify after fixing
      - npm run typecheck
      - npm test
`);
    rmSync(dir, { recursive: true });
  });

  test("generated template passes loadConfig validation", () => {
    const dir = createTempDir();
    const target = path.join(dir, "codesweep.yml");

    initConfig(target);
    const config = loadConfig(target);

    expect(config.check).toBeDefined();
    expect(config.fix).toBeDefined();
    rmSync(dir, { recursive: true });
  });

  test("throws when the file already exists and leaves it unchanged", () => {
    const dir = createTempDir();
    const target = path.join(dir, "codesweep.yml");
    writeFileSync(target, "original content", "utf-8");

    expect(() => initConfig(target)).toThrow(`Config file already exists: ${target}`);
    expect(readFileSync(target, "utf-8")).toBe("original content");
    rmSync(dir, { recursive: true });
  });

  test("throws when the target directory does not exist", () => {
    expect(() => initConfig("/nonexistent/dir/codesweep.yml")).toThrow();
  });
});
