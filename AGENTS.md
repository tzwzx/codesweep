# AGENTS.md

## Cursor Cloud specific instructions

`codesweep` is a **Bun/TypeScript CLI** (not a long-running service). It orchestrates code-quality pipelines (lint/typecheck/test/etc.) declared in a `codesweep.yml` file. There is nothing to "serve" — you exercise it by running the built CLI. Standard scripts live in `package.json` (`lint`, `tsc`, `test`, `build`, `dev`, `fix`, `codesweep:check`); the pipeline it runs on itself is defined in `codesweep.yml`.

Environment setup (Bun + a recent Node) is already baked into the VM snapshot, so the notes below are the non-obvious gotchas rather than install steps.

- **`bun install` alone fails here.** The `prepare` lifecycle script runs `lefthook install`, which errors because Cursor sets a custom `core.hooksPath`. Always install with `bun install --ignore-scripts` (this is what the startup update script does). Git hooks are irrelevant in the cloud VM, so skipping them is fine.
- **Node version matters for lint.** `bun run lint` invokes `oxfmt`, which loads the TypeScript config `oxfmt.config.ts` and therefore requires Node `^20.19.0 || >=22.18.0`. The image's default `/exec-daemon/node` is v22.14.0 (too old); a newer Node 22 is installed via `nvm` and sourced from `~/.bashrc`, so a normal shell already resolves `node` to the working version. If lint suddenly complains about `Unknown file extension ".ts"`, you're on the old Node — start a fresh shell (or `nvm use 22`).
- **Run the CLI against its own repo** for an end-to-end smoke test: `bun run build` then `bun run codesweep:check` (this is `node dist/cli.js check`, which runs lint + tsc + fallow + syncpack + test in parallel with fail-through).
- `dist/` and `node_modules/` are gitignored; `bun run build` (`tsc`) must run before any `dist/`-based command.
