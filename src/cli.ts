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
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import { codesweep } from "./index.js";
import { initConfig } from "./init.js";

/** True when this file is the process entry point (not imported by tests). */
const isDirectRun = (): boolean => {
  const [, entry] = process.argv;
  return entry !== undefined && import.meta.url === pathToFileURL(entry).href;
};

const HELP_TEXT = `
codesweep - Run code quality checks in one command 🧹

Usage:
  codesweep <command> [options]

Commands:
  init                  Create a starter codesweep.yml config file
  <mode>                Run a mode defined in your codesweep.yml (e.g. check, fix)
                        Note: "init" is reserved and cannot be used as a mode name

Options:
  --config, -c <path>   Path to the config file (default: ./codesweep.yml)
  --help, -h            Show help
`;

export interface CliArgs {
  config?: string;
  help: boolean;
  mode?: string;
}

/** Parse argv into structured CLI args. Throws on invalid option syntax. */
export const parseCliArgs = (argv: readonly string[]): CliArgs => {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    args: [...argv],
    options: {
      config: { short: "c", type: "string" },
      help: { short: "h", type: "boolean" },
    },
  });

  return {
    config: values.config,
    help: values.help === true,
    mode: positionals[0],
  };
};

/**
 * Run the requested CLI command.
 * @returns Process exit code (0 on success, 1 on failure).
 */
export const runCli = async (args: CliArgs): Promise<number> => {
  if (args.help) {
    console.log(HELP_TEXT);
    return 0;
  }

  if (!args.mode) {
    console.log(HELP_TEXT);
    return 1;
  }

  try {
    if (args.mode === "init") {
      // "init" is a reserved subcommand and never runs a user-defined mode.
      const createdPath = initConfig(args.config);
      console.log(`Created ${createdPath}`);
    } else {
      await codesweep(args.mode, args.config);
    }
    return 0;
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    }
    return 1;
  }
};

const main = async (): Promise<void> => {
  let args: CliArgs;
  try {
    args = parseCliArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  process.exit(await runCli(args));
};

// Only auto-run when invoked as the CLI entry point (not when imported by tests).
// Guard against any unexpected rejection escaping main() so the process
// always exits with a non-zero code instead of an unhandled rejection.
if (isDirectRun()) {
  try {
    await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
