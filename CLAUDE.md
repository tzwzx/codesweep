# codesweep

CLI tool for running code quality checks in one command. Customizable per project via a YAML config file.

## Project Overview

- **Purpose**: Run lint, format, typecheck, test, and other code quality commands in one go
- **Use cases**: Post-task checks for AI coding agents, pre-commit checks, CI pipelines
- **Distribution**: npm package / Git URL dependency
- **Runtime**: Node.js >= 18 / Bun compatible

## Development Commands

```bash
bun install        # Install dependencies
bun run build      # Build TypeScript (outputs to dist/)
bun run dev        # Watch mode build
```

## Architecture

```
src/
├── types.ts    # Type definitions (Stage, CodesweepConfig)
├── config.ts   # YAML config loading and validation
├── runner.ts   # Command execution logic (parallel: concurrently / sequential: child_process)
├── index.ts    # Main logic (pipeline execution) + library exports
└── cli.ts      # CLI entry point (arg parsing, process exit codes)
```

### Dependency Flow

```
cli.ts → index.ts → config.ts → types.ts
                   → runner.ts → types.ts
```

- `cli.ts`: Handles process I/O only (arg parsing, exit codes)
- `index.ts`: Orchestration (load config → run pipeline → output results)
- `config.ts`: YAML parsing + validation (pure data processing)
- `runner.ts`: Command execution abstraction (parallel/sequential)
- `types.ts`: Shared type definitions across all modules

### Design Principles

- **Mode-based pipeline**: check (read-only validation) and fix (auto-fix then validate)
- **Stage execution**: Each mode is an array of stages. Each stage is either sequential or parallel
- **Fail-through**: If one command fails, other commands in the same stage still run to completion
- **Serial between stages**: Stage 1 completes before stage 2 starts
- **Usable as a library**: `import { codesweep } from "codesweep"` for programmatic use

## YAML Config Format (codesweep.yml)

```yaml
check:
  - parallel: # Stage 1: parallel execution
      - bun lint
      - bun tsc
      - bun knip
      - bun test:unit

fix:
  - sequential: # Stage 1: sequential execution
      - bun fix
  - parallel: # Stage 2: parallel execution
      - bun tsc
      - bun knip
      - bun test:unit
```

### Validation Rules

- Config file must be a non-empty object
- At least one mode must be defined
- Mode names are arbitrary (e.g. `check`, `fix`, `lint`, `deploy`, ...)
- Each mode is an array of stages
- Each stage must have exactly one of `parallel` or `sequential` (not both)
- Command lists must be non-empty arrays of non-empty strings

## CLI Usage

```bash
codesweep check                       # Run quality checks
codesweep fix                         # Auto-fix then check
codesweep check --config ./custom.yml # Use custom config file
codesweep -h                          # Show help
```

- Mode: `check` or `fix` (required)
- Default config file: `./codesweep.yml` (current directory)
- Exit 0 on success / Exit 1 on failure
- Displays elapsed time in seconds

## Package Distribution

- `"bin"` field enables CLI distribution (`npx codesweep` to run)
- `"exports"` field enables library distribution
- `"files": ["dist"]` includes only dist/ in the npm package
- For Git URL distribution, **dist/ must be committed** (pre-built JS is required)

## Code Conventions

- Comments in English (for open-source readability)
- Error messages in English
- Functions defined as `const` + arrow functions
- Prefer pure functions without side effects
- Minimize `as` casts; use type guards (e.g., `isParallelStage`) instead
