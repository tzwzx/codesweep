# Quiet mode

`--quiet` prints nothing when every command passes, and prints only failing commands when one fails. The commands still run. The exit code stays 0 for a pass and 1 for a failure.

## Sub-features

- `quiet-pass` prints nothing and still runs the command.
- `quiet-fail` prints the failing command's output and omits the passing command's output.
- `quiet-sibling` still runs the passing sibling of a failed parallel command.
- `quiet-short` is the same silent pass with `-q`.

## How to get to it (user POV)

- Run `codesweep check --quiet`.
- Run `codesweep check -q`.

## Driving it with verify-codesweep

Preconditions:

- Launch has printed `ready`.
- A new session is exported and its work directory is empty.
- `.cursor/skills/verify-codesweep/verify-codesweep doctor` prints `ready` and `work=` equal to `CODESWEEP_VERIFY_WORK`.

- **Silent pass.** Write this `codesweep.yml` in the work directory:

```yaml
check:
  - sequential:
      - sh -c 'echo ran > marker.txt'
```

Run `.cursor/skills/verify-codesweep/verify-codesweep drive --label quiet-pass -- check --quiet`. `exit-code.txt` is `0`. `stdout.txt` and `stderr.txt` are both empty. They do not contain `codesweep check passed`. Run `.cursor/skills/verify-codesweep/verify-codesweep capture --label quiet-pass -- marker.txt`. The captured file is `ran` plus a newline.

- **Short flag.** Remove the marker from the work directory with `command rm -f "$CODESWEEP_VERIFY_WORK/marker.txt"`, then run `.cursor/skills/verify-codesweep/verify-codesweep drive --label quiet-short -- check -q`. `exit-code.txt` is `0`. `stdout.txt` and `stderr.txt` are both empty. Run `.cursor/skills/verify-codesweep/verify-codesweep capture --label quiet-short -- marker.txt`. The captured file is `ran` plus a newline.

- **Failure output only.** Replace `codesweep.yml` with:

```yaml
check:
  - parallel:
      - echo passing-noise
      - sh -c 'echo failing-detail; exit 1'
```

Run `.cursor/skills/verify-codesweep/verify-codesweep drive --label quiet-fail -- check --quiet`. `exit-code.txt` is `1`. `stdout.txt` contains `failing-detail` and does not contain `passing-noise`. `stderr.txt` contains `❌ Command failed: sh -c 'echo failing-detail; exit 1'`, `❌ codesweep check failed (`, and `Parallel execution failed:`. It does not contain `passing-noise` or `Unknown error`.

- **Sibling still runs.** Replace `codesweep.yml` with:

```yaml
check:
  - parallel:
      - sh -c 'echo passing-noise; echo ran > sibling.txt'
      - sh -c 'echo failing-detail; exit 1'
```

Run `.cursor/skills/verify-codesweep/verify-codesweep drive --label quiet-sibling -- check -q`. `exit-code.txt` is `1`. `stdout.txt` contains `failing-detail` and does not contain `passing-noise`. Run `.cursor/skills/verify-codesweep/verify-codesweep capture --label quiet-sibling -- sibling.txt`. The captured file is `ran` plus a newline.

## Gotchas

- A quiet pass has no elapsed-time line. The marker file is the proof that the command ran.
- Quiet mode does not apply to `init` or to help. `init --quiet` still prints `Created`.
- A quiet parallel failure says `Parallel execution failed:` followed by the command. It does not say `Unknown error`. That wording belongs to a parallel failure that is not quiet.
- Passing output is omitted, not the passing command. Capture the sibling marker before calling the run verified.
