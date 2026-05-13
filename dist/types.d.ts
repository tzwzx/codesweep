/**
 * codesweep - Type definitions
 */
/** Parallel execution stage */
export interface ParallelStage {
    parallel: string[];
}
/** Sequential execution stage */
export interface SequentialStage {
    sequential: string[];
}
/** Execution stage (parallel or sequential) */
export type Stage = ParallelStage | SequentialStage;
/** Mode name (any key defined in config) */
export type Mode = string;
/** Pipeline configuration (key = mode name, value = stages) */
export type CodesweepConfig = Record<string, Stage[]>;
//# sourceMappingURL=types.d.ts.map