# Create a starter config

`init` writes a starter codesweep config and prints the absolute path it created. A second run leaves the existing file untouched and exits 1. The name `init` always means this subcommand.

## Sub-features

- `init-default` writes `codesweep.yml` in the working directory.
- `init-config` writes the path given by `--config`.
- `init-exists` refuses to replace an existing file.
- `init-reserved` refuses the same way when that file defines a mode named `init`, and does not run the commands in it.

## How to get to it (user POV)

- Run `codesweep init` in the directory that should receive `codesweep.yml`.
- Run `codesweep init --config <path>`.
- Run `codesweep init -c <path>`.

## Driving it with verify-codesweep

Preconditions:

- Launch has printed `ready`.
- A new session is exported and its work directory has no `codesweep.yml` and no `custom.yml`.
- `.cursor/skills/verify-codesweep/verify-codesweep doctor` prints `ready` and `work=` equal to `CODESWEEP_VERIFY_WORK`.

- **Create the default file.** Run `.cursor/skills/verify-codesweep/verify-codesweep drive --label init-default -- init`. `exit-code.txt` is `0`. `stderr.txt` is empty. `stdout.txt` is `Created <work>/codesweep.yml` plus a trailing newline, with `<work>` equal to `CODESWEEP_VERIFY_WORK`. Run `.cursor/skills/verify-codesweep/verify-codesweep capture --label init-default -- codesweep.yml`. The captured file's bytes are the starter template:

```yaml
# codesweep configuration
# https://github.com/tzwzx/codesweep

check:
  - parallel: # Stage 1: run checks in parallel
      - npm run lint
      - npm run typecheck
      - npm test

fix:
  - sequential: # Stage 1: apply auto-fixes
      - npm run fix
  - parallel: # Stage 2: verify after fixing
      - npm run typecheck
      - npm test
```

The template ends with a newline after the last `npm test` line.

- **Refuse to overwrite.** Run `init` again. Run `.cursor/skills/verify-codesweep/verify-codesweep drive --label init-exists -- init`. `exit-code.txt` is `1`. `stdout.txt` is empty. `stderr.txt` is `Config file already exists: <work>/codesweep.yml` plus a trailing newline. Run `.cursor/skills/verify-codesweep/verify-codesweep capture --label init-exists -- codesweep.yml`. That copy matches the `init-default` capture byte for byte.

- **Create at --config.** Run `.cursor/skills/verify-codesweep/verify-codesweep drive --label init-config -- init --config "$CODESWEEP_VERIFY_WORK/custom.yml"`. `exit-code.txt` is `0`. `stderr.txt` is empty. `stdout.txt` is `Created <work>/custom.yml` plus a trailing newline. Run `.cursor/skills/verify-codesweep/verify-codesweep capture --label init-config -- custom.yml`. That copy matches the starter template byte for byte.

- **Reserved name.** Replace `custom.yml` with this file, which a user could write by hand:

```yaml
init:
  - sequential:
      - echo should-not-run
```

Run `.cursor/skills/verify-codesweep/verify-codesweep drive --label init-reserved -- init -c "$CODESWEEP_VERIFY_WORK/custom.yml"`. `exit-code.txt` is `1`. `stdout.txt` is empty and does not contain `should-not-run`. `stderr.txt` is `Config file already exists: <work>/custom.yml` plus a trailing newline. Run `.cursor/skills/verify-codesweep/verify-codesweep capture --label init-reserved -- custom.yml`. The captured file still starts with `init:` and still contains `should-not-run` only as text in the file.

## Gotchas

- `Created` always prints an absolute path.
- `init --quiet` still prints `Created`. Quiet mode does not apply to `init`.
- An existing file is left byte for byte unchanged. Compare the captured copies; do not trust the error text alone.
- Running `init` in the repository root hits the existing `codesweep.yml` and is not this proof.
- The starter template's commands are `npm run` scripts. Do not execute that template as the proof that `init` worked.
