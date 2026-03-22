/**
 * codesweep - Command execution logic (parallel/sequential)
 */
/**
 * Run commands sequentially (continues on failure)
 */
export declare const runSequential: (commands: readonly string[]) => Promise<void>;
/**
 * Run commands in parallel (continues on failure)
 */
export declare const runParallel: (commands: readonly string[]) => Promise<void>;
//# sourceMappingURL=runner.d.ts.map