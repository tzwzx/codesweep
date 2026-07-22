import { exec } from "node:child_process";
import { promisify } from "node:util";

import concurrently from "concurrently";

import type { RunOptions } from "./types.js";

const execPromise = promisify(exec);

// Quiet mode buffers everything a command prints, and analyzers can emit
// hundreds of kilobytes on a healthy project. Keep the ceiling well above
// Node's 1 MB default; overflowing it would report a passing command as failed.
const MAX_BUFFER = 32 * 1024 * 1024;

interface CommandOutput {
  stdout?: string;
  stderr?: string;
}

const printCommandOutput = ({ stdout, stderr }: CommandOutput): void => {
  if (stdout) {
    console.log(stdout);
  }
  if (stderr) {
    console.error(stderr);
  }
};

const reportFailure = (command: string, output: CommandOutput): void => {
  console.error(`❌ Command failed: ${command}`);
  printCommandOutput(output);
};

const runCommand = (command: string): Promise<CommandOutput> =>
  execPromise(command, { maxBuffer: MAX_BUFFER });

/**
 * Run commands sequentially (continues on failure).
 * All commands run even if one fails; errors are collected and thrown at the end.
 */
export const runSequential = async (
  commands: readonly string[],
  options: RunOptions = {},
): Promise<void> => {
  const errors: { command: string; message: string }[] = [];

  for (const command of commands) {
    try {
      // Commands run one-by-one by design (sequential stage); parallelizing would defeat the purpose.
      // oxlint-disable-next-line no-await-in-loop
      const output = await runCommand(command);
      if (!options.quiet) {
        printCommandOutput(output);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      reportFailure(command, error as CommandOutput);
      errors.push({ command, message });
    }
  }

  if (errors.length > 0) {
    const errorMessages = errors.map((e) => `${e.command}: ${e.message}`).join("\n");
    throw new Error(`Sequential execution failed:\n${errorMessages}`);
  }
};

/**
 * Run commands in parallel with their output buffered, printing only the ones
 * that failed. Every command still runs to completion, so a single run surfaces
 * every error at once.
 */
const runParallelQuiet = async (commands: readonly string[]): Promise<void> => {
  const results = await Promise.allSettled(commands.map((command) => runCommand(command)));

  const failures = results.flatMap((result, index) =>
    result.status === "rejected" ? [{ command: commands[index] ?? "", error: result.reason }] : [],
  );

  for (const { command, error } of failures) {
    reportFailure(command, error as CommandOutput);
  }

  if (failures.length > 0) {
    const failed = failures.map((failure) => failure.command).join("\n");
    throw new Error(`Parallel execution failed:\n${failed}`);
  }
};

/**
 * Run commands in parallel (continues on failure).
 * All commands run even if one fails; the error is thrown after all complete.
 */
export const runParallel = async (
  commands: readonly string[],
  options: RunOptions = {},
): Promise<void> => {
  if (options.quiet) {
    return runParallelQuiet(commands);
  }

  const commandObjects = commands.map((command) => ({ command }));

  const { result } = concurrently(commandObjects, {
    group: true,
    killOthersOn: [],
    prefix: "none",
  });

  try {
    await result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Parallel execution failed: ${message}`, { cause: error });
  }
};
