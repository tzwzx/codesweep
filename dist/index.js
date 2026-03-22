/**
 * codesweep - Main logic (mode-based pipeline execution)
 */
import { performance } from "node:perf_hooks";
import { isParallelStage, loadConfig } from "./config.js";
import { runParallel, runSequential } from "./runner.js";
export { isParallelStage, isSequentialStage, loadConfig } from "./config.js";
export { runParallel, runSequential } from "./runner.js";
const MILLISECONDS_PER_SECOND = 1000;
/** Format elapsed time in seconds */
const formatDuration = (startTime) => ((performance.now() - startTime) / MILLISECONDS_PER_SECOND).toFixed(2);
/** Run a single stage */
const runStage = (stage) => isParallelStage(stage) ? runParallel(stage.parallel) : runSequential(stage.sequential);
/** Run a pipeline (array of stages) in order */
const runPipeline = async (stages) => {
    for (const stage of stages) {
        await runStage(stage);
    }
};
/** Run the pipeline for the specified mode */
export const codesweep = async (mode, configPath) => {
    const config = loadConfig(configPath);
    const stages = config[mode];
    if (!stages) {
        const availableModes = Object.keys(config).join(", ");
        throw new Error(`Mode "${mode}" is not defined in the config file (available: ${availableModes})`);
    }
    const startTime = performance.now();
    try {
        await runPipeline(stages);
        const duration = formatDuration(startTime);
        console.log(`\n✅ codesweep ${mode} passed (${duration}s)\n`);
    }
    catch (error) {
        const duration = formatDuration(startTime);
        console.error(`\n❌ codesweep ${mode} failed (${duration}s)\n`);
        throw error;
    }
};
//# sourceMappingURL=index.js.map