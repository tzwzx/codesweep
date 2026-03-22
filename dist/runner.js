/**
 * codesweep - Command execution logic (parallel/sequential)
 */
import { exec } from "node:child_process";
import { promisify } from "node:util";
import concurrently from "concurrently";
const execPromise = promisify(exec);
/** Print stdout/stderr from a command */
const printCommandOutput = (stdout, stderr) => {
    if (stdout) {
        console.log(stdout);
    }
    if (stderr) {
        console.error(stderr);
    }
};
/** Run a single command */
const runSingleCommand = async (command) => {
    const { stdout, stderr } = await execPromise(command);
    printCommandOutput(stdout, stderr);
};
/**
 * Run commands sequentially (continues on failure)
 */
export const runSequential = async (commands) => {
    const errors = [];
    for (const command of commands) {
        try {
            await runSingleCommand(command);
        }
        catch (error) {
            const execError = error;
            console.error(`❌ Command failed: ${command}`);
            printCommandOutput(execError.stdout, execError.stderr);
            errors.push({ command, message: execError.message });
        }
    }
    if (errors.length > 0) {
        const errorMessages = errors.map((e) => `${e.command}: ${e.message}`).join("\n");
        throw new Error(`Sequential execution failed:\n${errorMessages}`);
    }
};
/**
 * Run commands in parallel (continues on failure)
 */
export const runParallel = async (commands) => {
    const commandObjects = commands.map((command) => ({ command }));
    const { result } = concurrently(commandObjects, {
        group: true,
        killOthersOn: [],
        prefix: "none",
    });
    try {
        await result;
    }
    catch (error) {
        const failures = error?.message || "Unknown error";
        throw new Error(`Parallel execution failed: ${failures}`, { cause: error });
    }
};
//# sourceMappingURL=runner.js.map