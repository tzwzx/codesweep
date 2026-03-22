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
const parseArgs = (argv) => {
    const args = argv.slice(2);
    let mode;
    let configPath;
    for (let i = 0; i < args.length; i += 1) {
        const arg = args[i];
        if (arg === "--config" || arg === "-c") {
            configPath = args[i + 1];
            if (!configPath) {
                console.error("❌ --config requires a file path");
                process.exit(1);
            }
            // Skip next argument
            i += 1;
        }
        else if (arg === "--help" || arg === "-h") {
            console.log(HELP_TEXT);
            process.exit(0);
        }
        else if (!arg.startsWith("-")) {
            mode = arg;
        }
    }
    return { configPath, mode };
};
const main = async () => {
    const { mode, configPath } = parseArgs(process.argv);
    if (!mode) {
        console.log(HELP_TEXT);
        process.exit(1);
    }
    try {
        await codesweep(mode, configPath);
        process.exit(0);
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(error.message);
        }
        process.exit(1);
    }
};
main();
//# sourceMappingURL=cli.js.map