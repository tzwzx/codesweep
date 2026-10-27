# Show help

Help tells a user which commands and options codesweep accepts. Asking for help exits 0. Running codesweep with no command prints the same text and exits 1.

## Sub-features

- `help-long` prints help for `--help` and exits 0.
- `help-short` prints the same help for `-h` and exits 0.
- `help-missing` prints the same help when no command is given and exits 1.

## How to get to it (user POV)

- Run `codesweep --help`.
- Run `codesweep -h`.
- Run `codesweep` with no command and no options.

## Driving it with verify-codesweep

Preconditions:

- Launch has printed `ready`.
- A new session is exported and its work directory is empty.
- `.cursor/skills/verify-codesweep/verify-codesweep doctor` prints `ready` and `work=` equal to `CODESWEEP_VERIFY_WORK`.

- **Long help.** Ask for help. Run `.cursor/skills/verify-codesweep/verify-codesweep drive --label help-long -- --help`. `exit-code.txt` is `0`. `stderr.txt` is empty. `stdout.txt` contains `codesweep - Run code quality checks in one command`, `Create a starter codesweep.yml config file`, `--config, -c <path>`, `--quiet, -q`, and `--help, -h`.
- **Short help.** Ask for help with the short flag. Run `.cursor/skills/verify-codesweep/verify-codesweep drive --label help-short -- -h`. `exit-code.txt` is `0`. `stderr.txt` is empty. `stdout.txt` has the same five substrings as `help-long`.
- **No command.** Run codesweep with no arguments. Run `.cursor/skills/verify-codesweep/verify-codesweep drive --label help-missing --`. `exit-code.txt` is `1`. `stderr.txt` is empty. `stdout.txt` has the same five substrings as `help-long`.

## Gotchas

- Doctor's `--help` smoke check does not prove this feature. The three drives above do.
- `--help` exits 0 and a missing command exits 1. The text matches; the exit code is the difference.
- Help does not read `codesweep.yml` and does not create a file. The work directory stays empty.
