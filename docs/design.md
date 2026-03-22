# codesweep Design Document

## 1. Background and Motivation

### Origin

Originally based on `scripts/check-all.ts` from the [sync project](https://github.com/tazawa/sync).
It was a script for running code quality checks in bulk for an Expo (React Native) app.

### Why Package It?

- Wanted to reuse the same mechanism across multiple public repositories
- Check commands differ per project, but the execution mechanism (parallel/sequential, timing, error handling) is shared
- Wanted a setup where you only need a YAML config file in each project

### Primary Use Cases

1. **Post-task checks for AI coding agents** — Add a rule in CLAUDE.md to run `bun codesweep:fix` after completing a task
2. **Pre-commit manual checks** — Run `bun codesweep check` to validate code quality in one go
3. **CI pipelines** — Run `codesweep check` in GitHub Actions, etc.

## 2. Naming History

### Candidates and Selection

| Candidate       | Concept          | Reason                                                               |
| --------------- | ---------------- | -------------------------------------------------------------------- |
| `preflight`     | Pre-flight check | ❌ Metaphor limited to "pre-checks". Doesn't fit post-AI-task checks |
| `checkmate`     | Chess checkmate  | ❌ Catchy but too playful                                            |
| `precheck`      | Pre-check        | ❌ Same issue as preflight                                           |
| `codeprobe`     | Code inspection  | ❌ Slightly long                                                     |
| `sweep`         | Sweep through    | ✅ Short (5 chars), not limiting, works as verb/noun                 |
| **`codesweep`** | Code sweep       | ✅ Final name — `sweep` was taken on npm                             |

### Why "codesweep"

- "Sweep" = running lint, format, typecheck, test all at once
- `codesweep check` / `codesweep fix` feels natural on the CLI
- Config file `codesweep.yml` is intuitive
- `sweep` was taken on npm, so `codesweep` was chosen as the available alternative

## 3. Architecture Design

### Module Structure

```
src/
├── types.ts    # Type definitions only (no logic)
├── config.ts   # Config I/O and validation
├── runner.ts   # Command execution abstraction
├── index.ts    # Orchestration + public API
└── cli.ts      # Process boundary (args, exit codes)
```

### Why This Split?

**Separation of concerns** was prioritized:

- `types.ts`: Referenced by all other modules. Independent to prevent circular dependencies
- `config.ts`: Handles file system access and validation. Easy to mock in tests
- `runner.ts`: Hides `concurrently` and `child_process` details. Easy to swap execution engines
- `index.ts`: Combines the above to run pipelines. Also serves as the public library API
- `cli.ts`: Only handles Node.js process I/O. Not needed for library usage

### YAML Design: Why "Mode-based Pipeline"

Three design options were considered:

#### Option A: Mode-based pipeline (✅ Adopted)

```yaml
check:
  - parallel:
      - bun lint
      - bun tsc
fix:
  - sequential:
      - bun fix
  - parallel:
      - bun tsc
```

#### Option B: Per-command definitions

```yaml
commands:
  lint:
    run: bun lint
    modes: [check]
  format:
    run: bun fix
    modes: [fix]
    sequential: true
  typecheck:
    run: bun tsc
```

#### Option C: Group-based (original check-all.yml)

```yaml
check_only:
  parallel:
    - bun lint
fix_only:
  sequential:
    - bun fix
shared:
  parallel:
    - bun tsc
```

**Why Option A was chosen:**

1. **Readability**: The execution flow for each mode is immediately clear from the config file
2. **Flexibility**: Complex pipelines like `sequential → parallel → sequential` are possible
3. **Explicitness**: No implicit rules like "omitting modes = all modes" (as in Option B)

**Trade-off:**

- Common commands (`bun tsc`, etc.) are duplicated across check and fix — not DRY
- → However, readability and explicitness of the config file were prioritized

## 4. Mapping from Original check-all.ts

| Original check-all.ts                            | codesweep                     | Changes                                      |
| ------------------------------------------------ | ----------------------------- | -------------------------------------------- |
| `Config` interface                               | `CodesweepConfig` (types.ts)  | Explicit `check` / `fix` keys                |
| 3 fixed groups (`parallel_check_commands`, etc.) | `Stage[]` pipeline            | Free stage count and ordering                |
| `readFileSync` + `parse`                         | `loadConfig()` (config.ts)    | Added validation, path specification support |
| `runSequential`                                  | `runSequential` (runner.ts)   | Nearly identical                             |
| `runConcurrentlyOnly`                            | `runParallel` (runner.ts)     | Improved function name                       |
| `runCheck` / `runFix`                            | `codesweep(mode)` (index.ts)  | Unified invocation by mode name              |
| `runWithTimer` / `exitWithTimerMessage`          | Timing logic in `codesweep()` | process.exit separated to cli.ts             |
| `process.argv` handling                          | `parseArgs()` (cli.ts)        | Added --config, --help options               |

### Design Improvements

1. **Separated process.exit**: Originally called within logic; now isolated to CLI layer. Process won't exit during library usage
2. **Added validation**: YAML structure is validated at startup. No crashes from invalid config during execution
3. **--config option**: Config file path can be specified. Useful for monorepos, etc.

## 5. Key Design Decisions

### Fail-through Strategy

**Decision:** If one command fails, other commands in the same stage still run to completion.

**Reason:** For example, even if lint fails, you still want to see typecheck results. It's more efficient to see all issues in one run.

### Serial Execution Between Stages

**Decision:** Stage 1 → Stage 2 → ... always runs serially.

**Reason:** In fix mode, "format first (sequential) → then check (parallel)" — the output of a previous stage can be the input for the next.

### Why Use concurrently

**Decision:** Use the `concurrently` package for parallel execution.

**Reason:**

- Groups output from each command (`group: true`)
- Continues running others when one fails (`killOthersOn: []`)
- Controls output prefixing (`prefix: "none"`)
- Promise.all + child_process would produce mixed, hard-to-read output

### Committing dist/ for Git URL Distribution

**Decision:** Include the `dist/` directory in version control.

**Reason:** Git URL dependencies (`github:user/codesweep`) don't run build steps on install. Pre-built JS is required. If switching to npm publish, simply add dist/ to `.gitignore`.

## 6. Future Extension Candidates

Not implemented yet, but potentially useful features:

- **`--dry-run` option**: Display commands without executing them
- **`--verbose` / `--quiet` options**: Control output verbosity
- **Config extends/inheritance**: Override project-specific settings on top of a shared base
- **Conditional execution**: Run commands only when specific files have changed
- **npm publish**: Publish to npmjs.com for strict version management
- **Test suite**: Unit tests (config validation, etc.), E2E tests (CLI execution)
