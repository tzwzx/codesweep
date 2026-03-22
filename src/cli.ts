#!/usr/bin/env node

/**
 * codesweep CLI - Run code quality checks in one command
 *
 * Usage:
 *   codesweep <mode> [--config path]
 *
 * Examples:
 *   codesweep check                       # Run quality checks
 *   codesweep fix                         # Auto-fix then check
 *   codesweep check --config ./custom.yml # Use custom config file
 */

import process from "node:process";
import { parseArgs } from "node:util";

import { codesweep } from "./index.js";

const HELP_TEXT = `
codesweep - Run code quality checks in one command 🧹

Usage:
  codesweep <mode> [options]

Modes:
  Any mode defined in your codesweep.yml (e.g. check, fix, ...)

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
    await codesweep(mode, values.config);
    process.exit(0);
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }
};

main();
