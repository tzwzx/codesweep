/**
 * codesweep - Command execution logic (parallel/sequential)
 */
/**
 * Run commands sequentially (continues on failure).
 * All commands run even if one fails; errors are collected and thrown at the end.
 */
export declare const runSequential: (commands: readonly string[]) => Promise<void>;
/**
 * Run commands in parallel (continues on failure).
 * All commands run even if one fails; the error is thrown after all complete.
 */
export declare const runParallel: (commands: readonly string[]) => Promise<void>;
//# sourceMappingURL=runner.d.ts.map