# Fail through a stage

When one command in a stage fails, the other commands in that stage still run. The stage then fails. Later stages do not start. A passing pipeline runs stages in order.

## Sub-features

- `fail-sequential` runs the remaining commands in a sequential stage after one command fails.
- `fail-parallel` runs the sibling command in a parallel stage after one command fails.
- `fail-stops-next-stage` does not start the stage that follows a failed stage.
- `stage-order` runs a later stage only after the earlier stage finishes.

## How to get to it (user POV)

- Put more than one command under `sequential` or `parallel` in `codesweep.yml`.
- Put more than one stage under a mode.
- Run `codesweep check`.

## Driving it with verify-codesweep

Preconditions:

- Launch has printed `ready`.
- A new session is exported and its work directory is empty.
- `.cursor/skills/verify-codesweep/verify-codesweep doctor` prints `ready` and `work=` equal to `CODESWEEP_VERIFY_WORK`.

- **Sequential siblings.** Write this `codesweep.yml` in the work directory:

```yaml
check:
  - sequential:
      - sh -c 'echo first > first.txt'
      - sh -c 'echo second > second.txt; exit 1'
      - sh -c 'echo third > third.txt'
```

Run `.cursor/skills/verify-codesweep/verify-codesweep drive --label fail-sequential -- check`. `exit-code.txt` is `1`. `stdout.txt` is empty. `stderr.txt` contains `❌ Command failed: sh -c 'echo second > second.txt; exit 1'`, a line `❌ codesweep check failed (<seconds>s)` with `<seconds>` matching `[0-9]+\.[0-9]{2}`, and `Sequential execution failed:`. It does not contain `Command failed: sh -c 'echo first` or `Command failed: sh -c 'echo third`. Run `.cursor/skills/verify-codesweep/verify-codesweep capture --label fail-sequential -- first.txt`, then the same capture command for `second.txt` and `third.txt`. All three captured files exist. `first.txt` is `first` plus a newline, `second.txt` is `second` plus a newline, and `third.txt` is `third` plus a newline.

- **Parallel sibling and a skipped later stage.** Replace `codesweep.yml` with:

```yaml
check:
  - sequential:
      - sh -c 'echo stage1 > order.txt'
  - parallel:
      - sh -c 'echo sibling > sibling.txt'
      - sh -c 'echo fail-out; exit 1'
  - sequential:
      - sh -c 'echo stage2 >> order.txt'
```

Run `.cursor/skills/verify-codesweep/verify-codesweep drive --label fail-parallel -- check`. `exit-code.txt` is `1`. `stdout.txt` contains `fail-out`, `sh -c 'echo sibling > sibling.txt' exited with code 0`, and `sh -c 'echo fail-out; exit 1' exited with code 1`. `stderr.txt` contains `❌ codesweep check failed (` and `Parallel execution failed: Unknown error`. It does not contain `❌ Command failed:`. Run `.cursor/skills/verify-codesweep/verify-codesweep capture --label fail-parallel -- sibling.txt` and `.cursor/skills/verify-codesweep/verify-codesweep capture --label fail-parallel -- order.txt`. `sibling.txt` is `sibling` plus a newline. `order.txt` is `stage1` plus a newline and does not contain `stage2`.

- **Stage order on success.** Replace `codesweep.yml` with:

```yaml
check:
  - sequential:
      - sh -c 'echo stage1 > order.txt'
  - sequential:
      - sh -c 'echo stage2 >> order.txt'
```

Run `.cursor/skills/verify-codesweep/verify-codesweep drive --label stage-order -- check`. `exit-code.txt` is `0`. `stderr.txt` is empty. `stdout.txt` contains `✅ codesweep check passed (`. Run `.cursor/skills/verify-codesweep/verify-codesweep capture --label stage-order -- order.txt`. The captured file is `stage1` and `stage2` on separate lines, in that order, each with a trailing newline.

## Gotchas

- A failed stage does not cancel its siblings. It does cancel every stage after it. `order.txt` lacking `stage2` is the proof, not the banner alone.
- In a parallel stage that is not quiet, command output and `exited with code` lines are on stdout. The stderr summary is `Parallel execution failed: Unknown error` and does not name the command. The stdout lines name it.
- In a sequential stage, `❌ Command failed:` is on stderr and names the failing command only.
- These commands write marker files in the work directory. Capture them before cleanup.
