import { writeFileSync } from "node:fs";

import { resolveConfigPath } from "./config.js";

const CONFIG_TEMPLATE = `# codesweep configuration
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
`;

/**
 * Create a starter codesweep.yml config file.
 *
 * @param configPath - Destination path (default: `./codesweep.yml`).
 * @returns The absolute path of the created file.
 * @throws {Error} If a file already exists at the destination.
 */
export const initConfig = (configPath?: string): string => {
  const resolvedPath = resolveConfigPath(configPath);

  try {
    // The "wx" flag fails atomically if the file already exists,
    // avoiding a check-then-write race condition.
    writeFileSync(resolvedPath, CONFIG_TEMPLATE, { encoding: "utf-8", flag: "wx" });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "EEXIST") {
      throw new Error(`Config file already exists: ${resolvedPath}`, { cause: error });
    }
    throw error;
  }

  return resolvedPath;
};
