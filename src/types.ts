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

/** Options controlling how a pipeline is run */
export interface RunOptions {
  /**
   * Buffer command output and print only what failed.
   * A run where everything passes produces no output at all, which keeps CI
   * logs to just the problems.
   */
  quiet?: boolean;
}
