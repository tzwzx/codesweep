/**
 * codesweep - YAML config loading and validation
 */
import type { ParallelStage, SequentialStage, Stage, CodesweepConfig } from "./types.js";
export declare const isParallelStage: (stage: Stage) => stage is ParallelStage;
export declare const isSequentialStage: (stage: Stage) => stage is SequentialStage;
export declare const loadConfig: (configPath?: string) => CodesweepConfig;
//# sourceMappingURL=config.d.ts.map