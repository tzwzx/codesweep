---
name: verify-codesweep
description: "Drive the codesweep CLI in a disposable directory and prove help, init, mode runs, fail-through, and quiet mode. Use when changing the CLI, config loading, or pipeline execution and a user-level proof is required."
---

# Verify codesweep

codesweep is a short-lived CLI. The primary surface is `codesweep <command>` after `npm install` or the built file `dist/cli.js`. There is no server, port, database, or login. Each drive is one process in its own tmux session and its own empty directory.

The feature map in `features/README.md` is the maintained source for what to prove. Read it before driving. This file is how to launch, check, drive, and clean up.

## Other surfaces

The package also exports a library, `import { codesweep } from "@tzwzx/codesweep"` (`src/index.ts`, README section "Library usage"). The seed map does not cover that import. Do not treat a library call as proof of a CLI feature.

## Launch

`node` >= 22 and `bun` >= 1 must be on `PATH`. From the repository root:

```bash
bun install --frozen-lockfile --ignore-scripts
bun run build
```

`--ignore-scripts` skips `prepare`, which runs `lefthook install`. That hook exits 1 when git `core.hooksPath` is already set, and the CLI build does not need git hooks. The install still provides the packages the build and the CLI import.

The helper runs those two commands, then doctor:

```bash
.cursor/skills/verify-codesweep/verify-codesweep launch
```

Ready means stdout contains a line `ready` and a line `cli=` ending in `/dist/cli.js`, and `node dist/cli.js --help` has already exited 0. There is no long-running process to wait for. `dist/` is gitignored; launch recreates it.

Open a disposable session only after launch succeeds:

```bash
eval "$(.cursor/skills/verify-codesweep/verify-codesweep session)"
```

That creates an empty work directory and a separate evidence directory and prints `export` lines for `CODESWEEP_VERIFY_RUN`, `CODESWEEP_VERIFY_WORK`, `CODESWEEP_VERIFY_EVIDENCE`, and `CODESWEEP_CLI`. Keep those variables until cleanup. One session is one feature journey. Start another session for the next feature.

Teardown is `cleanup` below. It removes the work directory and any tmux session this run started. It leaves the evidence directory in place.

## Doctor

Run doctor after launch, after every new session, and again after any drive whose result you did not expect. Doctor is read-only apart from a `--help` smoke check in `/tmp`.

```bash
.cursor/skills/verify-codesweep/verify-codesweep doctor
```

Stdout must contain `ready`. When a session is exported, it must also contain `cli=` for this checkout's `dist/cli.js`, `work=` equal to `CODESWEEP_VERIFY_WORK`, and `evidence=` equal to `CODESWEEP_VERIFY_EVIDENCE`. `version=` is the `version` field in `package.json`. Doctor exits non-zero when node is older than 22, `dist/cli.js` is missing, a non-test file under `src/` is newer than `dist/cli.js`, `--help` fails, or the session directories are missing or outside `/tmp/codesweep-verify-work` and `/tmp/codesweep-verify-evidence`.

The `--help` smoke check is not proof of the help feature. Help proof is a labeled drive in the feature map.

A doctor failure after a source edit means launch again. A drive that captured an unexpected CLI result means run doctor, then start a new session before the next feature. Do not keep writing into a work directory whose files you no longer trust.

## Drive

Drive only through the helper. It refuses a work directory that is not the session directory under `/tmp/codesweep-verify-work/<run>`. Never point a drive at the repository root: this repo's `codesweep.yml` `fix` mode runs `bun fix`.

```bash
.cursor/skills/verify-codesweep/verify-codesweep drive --label <id> -- <codesweep argv>
```

`<id>` matches `[a-z0-9-]+`. Arguments after `--` are the codesweep argv, for example `init`, `check --quiet`, or `check --config "$CODESWEEP_VERIFY_WORK/custom.yml"`.

Each drive:

1. Creates a new tmux session named `codesweep-verify-<run>-<id>` with its working directory set to the session work directory.
2. Runs `node dist/cli.js` with the given argv inside that session.
3. Waits until the session exits. The default wait is 60 seconds (`CODESWEEP_VERIFY_TIMEOUT_SECONDS` overrides it). On timeout it kills that session and exits non-zero.
4. Writes the evidence files named in Evidence.

The helper's own exit code is 0 when those files were written, including when the CLI exits 1. The CLI's exit code is the single line in `exit-code.txt`. A missing `exit-code.txt` is a harness failure: cleanup, doctor, new session, then retry that drive.

Copy a file the CLI created before cleanup:

```bash
.cursor/skills/verify-codesweep/verify-codesweep capture --label <id> -- <work-relative-path>
```

The path is relative to the work directory, must not contain `..`, and must name a file. The copy is stored under the label directory using the file's basename.

User setup that is not itself a codesweep command, such as writing a `codesweep.yml` with a heredoc, happens in `CODESWEEP_VERIFY_WORK` between drives. Do that in the shell. Do not import `runCli`, do not run `bun test`, and do not call `codesweep()` for a CLI proof.

## Evidence

Evidence for run `<run>` and label `<id>` is a directory:

`/tmp/codesweep-verify-evidence/<run>/<id>/`

| File | Contents |
| --- | --- |
| `command.txt` | The `node dist/cli.js ...` invocation |
| `work.txt` | The work directory |
| `pty-session.txt` | The tmux session name |
| `stdout.txt` | CLI stdout |
| `stderr.txt` | CLI stderr |
| `exit-code.txt` | CLI exit code |
| captured basename | A work-directory file copied with `capture` |

A proof of a CLI feature includes the command, both streams, and the exit code, plus a second view of any side effect (the captured file, or a marker file the shell command wrote). A passing `--quiet` run is empty stdout and empty stderr; prove the commands ran by capturing the marker file. Do not treat the helper's exit code as the CLI's exit code.

Record the feature file name and the label with the artifacts. An entry point that cannot be reached needs the command you ran and the missing precondition. Driving a different entry point does not verify the one you skipped.

`--quiet` changes what is printed. It does not skip commands. Confirm that with a marker file when the recipe says the run should be silent.

## Cleanup

```bash
.cursor/skills/verify-codesweep/verify-codesweep cleanup
```

Cleanup kills every tmux session this run recorded in `sessions.txt`, then deletes `CODESWEEP_VERIFY_WORK`. It does not delete `CODESWEEP_VERIFY_EVIDENCE`. After it returns, `work removed` is printed, the work path does not exist, and the evidence path still does. Run cleanup after a failed drive too, then start a new session if you need to drive again. Do not kill processes by name.

## Helpers

The executable helper is `.cursor/skills/verify-codesweep/verify-codesweep`.

```bash
.cursor/skills/verify-codesweep/verify-codesweep launch
eval "$(.cursor/skills/verify-codesweep/verify-codesweep session)"
.cursor/skills/verify-codesweep/verify-codesweep doctor
.cursor/skills/verify-codesweep/verify-codesweep drive --label <id> -- <codesweep argv>
.cursor/skills/verify-codesweep/verify-codesweep capture --label <id> -- <work-relative-path>
.cursor/skills/verify-codesweep/verify-codesweep cleanup
```

`launch` needs `bun` and `node`. Every other subcommand needs `node` and `tmux`. `drive` and `cleanup` use `tmux -f /exec-daemon/tmux.portal.conf` when that file exists, and plain `tmux` otherwise. Two runs can proceed at the same time only with different `CODESWEEP_VERIFY_RUN` values. Do not drive a second journey inside a work directory another journey is using.
