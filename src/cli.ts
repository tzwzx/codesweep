#!/usr/bin/env node

/**
 * codesweep CLI - Run code quality checks in one command
 *
 * Usage:
 *   codesweep <command> [--config path]
 *
 * Examples:
 *   codesweep init                        # Create a starter codesweep.yml
 *   codesweep check                       # Run quality checks
 *   codesweep fix                         # Auto-fix then check
 *   codesweep check --config ./custom.yml # Use custom config file
 */

import process from "node:process";
import { parseArgs } from "node:util";

import { codesweep } from "./index.js";
import { initConfig } from "./init.js";

const HELP_TEXT = `
codesweep - Run code quality checks in one command 🧹

Usage:
  codesweep <command> [options]

Commands:
  init                  Create a starter codesweep.yml config file
  <mode>                Run a mode defined in your codesweep.yml (e.g. check, fix)
                        Note: "init" is reserved and cannot be used as a mode name

Options:
  --config, -c <path>   Path to config file (default: ./codesweep.yml)
  --help, -h            Show help
`;

const main = async (): Promise<void> => {
  let values: { config?: string; help?: boolean };
  let positionals: string[];

  try {
    ({ values, positionals } = parseArgs({
      allowPositionals: true,
      args: process.argv.slice(2),
      options: {
        config: { short: "c", type: "string" },
        help: { short: "h", type: "boolean" },
      },
    }));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  if (values.help) {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  const [mode] = positionals;

  if (!mode) {
    console.log(HELP_TEXT);
    process.exit(1);
  }

  try {
    if (mode === "init") {
      // "init" is a reserved subcommand and never runs a user-defined mode.
      const createdPath = initConfig(values.config);
      console.log(`Created ${createdPath}`);
    } else {
      await codesweep(mode, values.config);
    }
    process.exit(0);
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }
};

// Guard against any unexpected rejection escaping main() so the process
// always exits with a non-zero code instead of an unhandled rejection.
try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
