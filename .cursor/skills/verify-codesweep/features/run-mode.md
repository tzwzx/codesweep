# Run a mode

A mode name runs the pipeline declared for that name in the config file. A passing run prints each command's output and a passed line with the elapsed time. A missing file, an unknown mode, or a bad option exits 1 without that passed line.

## Sub-features

- `run-pass` runs the `check` mode from `./codesweep.yml`.
- `run-custom` runs a mode whose name is not `check` or `fix`.
- `run-config` and `run-config-short` select a config file with `--config` and `-c`.
- `run-parallel` runs two commands in one parallel stage.
- `run-missing` reports a config path that does not exist.
- `run-unknown` reports a mode the file does not define.
- `run-bad-config` and `run-bad-option` reject an option with no value and an unknown option.
- `run-invalid` reports a config that defines no modes.

## How to get to it (user POV)

- Run `codesweep <mode>` in a directory that contains `codesweep.yml`.
- Run `codesweep <mode> --config <path>`.
- Run `codesweep <mode> -c <path>`.

## Driving it with verify-codesweep

Preconditions:

- Launch has printed `ready`.
- A new session is exported and its work directory is empty.
- `.cursor/skills/verify-codesweep/verify-codesweep doctor` prints `ready` and `work=` equal to `CODESWEEP_VERIFY_WORK`.

- **Passing check.** Write this `codesweep.yml` in the work directory:

```yaml
check:
  - sequential:
      - echo hello
```

Run `.cursor/skills/verify-codesweep/verify-codesweep drive --label run-pass -- check`. `exit-code.txt` is `0`. `stderr.txt` is empty. `stdout.txt` contains `hello` and a line `✅ codesweep check passed (<seconds>s)` where `<seconds>` matches `[0-9]+\.[0-9]{2}`.

- **Custom mode.** Write this `codesweep.yml` over the previous file:

```yaml
lint:
  - sequential:
      - echo linting
```

Run `.cursor/skills/verify-codesweep/verify-codesweep drive --label run-custom -- lint`. `exit-code.txt` is `0`. `stderr.txt` is empty. `stdout.txt` contains `linting` and `✅ codesweep lint passed (`.

- **Long config flag.** Write this file at `$CODESWEEP_VERIFY_WORK/alt.yml`:

```yaml
check:
  - sequential:
      - echo from-alt
```

Run `.cursor/skills/verify-codesweep/verify-codesweep drive --label run-config -- check --config "$CODESWEEP_VERIFY_WORK/alt.yml"`. `exit-code.txt` is `0`. `stderr.txt` is empty. `stdout.txt` contains `from-alt` and `✅ codesweep check passed (`.

- **Short config flag.** Run `.cursor/skills/verify-codesweep/verify-codesweep drive --label run-config-short -- check -c "$CODESWEEP_VERIFY_WORK/alt.yml"`. `exit-code.txt` is `0`. `stderr.txt` is empty. `stdout.txt` contains `from-alt` and `✅ codesweep check passed (`.

- **Parallel stage.** Replace `codesweep.yml` with:

```yaml
check:
  - parallel:
      - echo one
      - echo two
```

Run `.cursor/skills/verify-codesweep/verify-codesweep drive --label run-parallel -- check`. `exit-code.txt` is `0`. `stderr.txt` is empty. `stdout.txt` contains `one`, `two`, `echo one exited with code 0`, `echo two exited with code 0`, and `✅ codesweep check passed (`. Either command may appear first.

- **Missing file.** Run `.cursor/skills/verify-codesweep/verify-codesweep drive --label run-missing -- fix --config "$CODESWEEP_VERIFY_WORK/missing.yml"`. `exit-code.txt` is `1`. `stdout.txt` is empty. `stderr.txt` is `Config file not found: <work>/missing.yml` plus a trailing newline. It does not contain `codesweep fix failed`.

- **Unknown mode.** With `alt.yml` still defining only `check`, run `.cursor/skills/verify-codesweep/verify-codesweep drive --label run-unknown -- fix -c "$CODESWEEP_VERIFY_WORK/alt.yml"`. `exit-code.txt` is `1`. `stdout.txt` is empty. `stderr.txt` is `Mode "fix" is not defined in the config file (available: check)` plus a trailing newline. It does not contain `codesweep fix failed`.

- **Option without a value.** Run `.cursor/skills/verify-codesweep/verify-codesweep drive --label run-bad-config -- check --config`. `exit-code.txt` is `1`. `stdout.txt` is empty. `stderr.txt` contains `Option '-c, --config <value>' argument missing`.

- **Unknown option.** Run `.cursor/skills/verify-codesweep/verify-codesweep drive --label run-bad-option -- --nope`. `exit-code.txt` is `1`. `stdout.txt` is empty. `stderr.txt` contains `Unknown option '--nope'`.

- **Empty config.** Replace `codesweep.yml` with `{}` and a trailing newline. Run `.cursor/skills/verify-codesweep/verify-codesweep drive --label run-invalid -- check`. `exit-code.txt` is `1`. `stdout.txt` is empty. `stderr.txt` is `Config must define at least one mode` plus a trailing newline. It does not contain `codesweep check failed`.

## Gotchas

- The passed line always uses two digits after the decimal point, including `0.00s`.
- A config or mode error is printed alone. There is no failed banner for those errors.
- `--config` without a path fails before any config file is read.
- Parallel success lines include `exited with code 0` in addition to the command output. Do not require one command to appear before the other.
- The repository's own `codesweep.yml` is not a fixture for this feature.
