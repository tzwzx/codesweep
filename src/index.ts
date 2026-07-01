import { performance } from "node:perf_hooks";

import { isParallelStage, loadConfig } from "./config.js";
import { runParallel, runSequential } from "./runner.js";
import type { Stage, Mode } from "./types.js";

export type { CodesweepConfig, Stage, ParallelStage, SequentialStage, Mode } from "./types.js";
export { isParallelStage, isSequentialStage, loadConfig } from "./config.js";
export { runParallel, runSequential } from "./runner.js";

const MILLISECONDS_PER_SECOND = 1000;

const formatDuration = (startTime: number): string =>
  ((performance.now() - startTime) / MILLISECONDS_PER_SECOND).toFixed(2);

const runStage = (stage: Stage): Promise<void> =>
  isParallelStage(stage) ? runParallel(stage.parallel) : runSequential(stage.sequential);

const runPipeline = async (stages: readonly Stage[]): Promise<void> => {
  for (const stage of stages) {
    // Stages run serially by design ("serial between stages"); parallelizing would break the contract.
    // oxlint-disable-next-line no-await-in-loop
    await runStage(stage);
  }
};

/**
 * Load the config file, then run the pipeline for the given mode.
 *
 * Stages run one after another; within a stage, commands run in parallel or
 * sequentially as configured. Resolves when every command succeeds.
 *
 * @param mode - Mode name to run (must be defined in the config file).
 * @param configPath - Path to the config file (default: `./codesweep.yml`).
 * @throws {Error} If the mode is undefined, or any command in the pipeline fails.
 */
export const codesweep = async (mode: Mode, configPath?: string): Promise<void> => {
  const config = loadConfig(configPath);
  const stages = config[mode];

  if (!stages) {
    const availableModes = Object.keys(config).join(", ");
    throw new Error(
      `Mode "${mode}" is not defined in the config file (available: ${availableModes})`,
    );
  }

  const startTime = performance.now();

  try {
    await runPipeline(stages);
    const duration = formatDuration(startTime);
    console.log(`\n✅ codesweep ${mode} passed (${duration}s)\n`);
  } catch (error) {
    const duration = formatDuration(startTime);
    console.error(`\n❌ codesweep ${mode} failed (${duration}s)\n`);
    throw error;
  }
};
