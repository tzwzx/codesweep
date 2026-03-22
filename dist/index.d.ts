/**
 * codesweep - Main logic (mode-based pipeline execution)
 */
import type { Mode } from "./types.js";
export type { CodesweepConfig, Stage, ParallelStage, SequentialStage, Mode } from "./types.js";
export { isParallelStage, isSequentialStage, loadConfig } from "./config.js";
export { runParallel, runSequential } from "./runner.js";
/** Run the pipeline for the specified mode */
export declare const codesweep: (mode: Mode, configPath?: string) => Promise<void>;
//# sourceMappingURL=index.d.ts.map