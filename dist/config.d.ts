/**
 * codesweep - YAML config loading and validation
 */
import type { ParallelStage, SequentialStage, Stage, CodesweepConfig } from "./types.js";
/** Check if a stage is a parallel stage */
export declare const isParallelStage: (stage: Stage) => stage is ParallelStage;
/** Check if a stage is a sequential stage */
export declare const isSequentialStage: (stage: Stage) => stage is SequentialStage;
/** Load and parse the config file */
export declare const loadConfig: (configPath?: string) => CodesweepConfig;
//# sourceMappingURL=config.d.ts.map