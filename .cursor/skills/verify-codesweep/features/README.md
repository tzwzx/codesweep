# codesweep verification map

This directory is the maintained source for verifying the user-facing behavior of the codesweep CLI. Read the index before driving, then use the matching feature file as the recipe.

## Baseline preconditions

- `node` >= 22 and `bun` >= 1 are on `PATH`. `tmux` is on `PATH`.
- Launch once from the repository with `.cursor/skills/verify-codesweep/verify-codesweep launch` and require a `ready` line.
- Start each feature with `eval "$(.cursor/skills/verify-codesweep/verify-codesweep session)"` so the work directory is an empty directory under `/tmp/codesweep-verify-work/<run>`.
- Run `.cursor/skills/verify-codesweep/verify-codesweep doctor` and require `ready`, `cli=` ending in `/dist/cli.js`, and `work=` equal to `CODESWEEP_VERIFY_WORK`.
- Never drive the repository root. Never drive a work directory this session did not create.

## Driving conventions

- Start every recipe from a new session unless that recipe says to continue.
- Treat every command as literal. Keep quoted names and flags unchanged.
- Run codesweep only through `.cursor/skills/verify-codesweep/verify-codesweep drive`.
- The helper exits 0 when it captured the CLI. Read `exit-code.txt` for the CLI's exit code.
- Copy side-effect files with `.cursor/skills/verify-codesweep/verify-codesweep capture` before cleanup.
- Restore nothing in the repository. The work directory is disposable.
- Do not remove proof artifacts during cleanup.

## Proof and skip reporting

- Capture the command, stdout, stderr, and exit code, not only the exit code.
- Mutation proof includes the captured file written in the work directory.
- A silent success still needs a marker file that shows the command ran.
- Record the feature file and the drive label with every artifact.
- Report an unreachable path with the attempted command and the unmet precondition.
- Do not report a skipped entry point as verified through a different path.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the user-visible behavior. It then uses exactly four H2 sections in this order.

1. `Sub-features` lists short IDs with one line for each behavior.
2. `How to get to it (user POV)` lists every user entry point.
3. `Driving it with verify-codesweep` starts with `Preconditions:` and uses labeled bullets that pair each user action with an exact command and observable result.
4. `Gotchas` lists traps that can waste or invalidate a verification run.

Keep implementation details out of the map. Name only user paths, stable handles, required state, commands, and observable proof.

## Features

- [Show help](./help.md) covers `--help`, `-h`, and invoking codesweep with no command.
- [Create a starter config](./init.md) covers `init` in the working directory, `--config`, `-c`, an existing file, and the reserved `init` name.
- [Run a mode](./run-mode.md) covers a passing pipeline, a custom mode name, `--config` and `-c`, a missing file, an unknown mode, and rejected options.
- [Fail through a stage](./fail-through.md) covers continuing sibling commands, stopping later stages, and stage order.
- [Quiet mode](./quiet.md) covers a silent pass, failure-only output, and sibling commands that still run.
