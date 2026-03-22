/**
 * codesweep - Command execution logic (parallel/sequential)
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";

import concurrently from "concurrently";

const execPromise = promisify(exec);

const printCommandOutput = (stdout?: string, stderr?: string): void => {
  if (stdout) {
    console.log(stdout);
  }
  if (stderr) {
    console.error(stderr);
  }
};

const runSingleCommand = async (command: string): Promise<void> => {
  const { stdout, stderr } = await execPromise(command);
  printCommandOutput(stdout, stderr);
};

/**
 * Run commands sequentially (continues on failure).
 * All commands run even if one fails; errors are collected and thrown at the end.
 */
export const runSequential = async (commands: readonly string[]): Promise<void> => {
  const errors: { command: string; message: string }[] = [];

  for (const command of commands) {
    try {
      await runSingleCommand(command);
    } catch (error) {
      const { stdout, stderr } = error as { stdout?: string; stderr?: string };
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ Command failed: ${command}`);
      printCommandOutput(stdout, stderr);
      errors.push({ command, message });
    }
  }

  if (errors.length > 0) {
    const errorMessages = errors.map((e) => `${e.command}: ${e.message}`).join("\n");
    throw new Error(`Sequential execution failed:\n${errorMessages}`);
  }
};

/**
 * Run commands in parallel (continues on failure).
 * All commands run even if one fails; the error is thrown after all complete.
 */
export const runParallel = async (commands: readonly string[]): Promise<void> => {
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
