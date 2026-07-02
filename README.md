# codesweep

[![npm version](https://img.shields.io/npm/v/@tzwzx/codesweep.svg)](https://www.npmjs.com/package/@tzwzx/codesweep)
[![license](https://img.shields.io/npm/l/@tzwzx/codesweep.svg)](./LICENSE)

Run lint, format, typecheck, test, and other code quality commands in one go. Configure each project with a YAML file.

## Why codesweep?

Task runners like [concurrently](https://www.npmjs.com/package/concurrently) and [npm-run-all2](https://www.npmjs.com/package/npm-run-all2) are great at running commands in parallel, but multi-stage pipelines — apply fixes first, then verify everything in parallel — quickly turn into hard-to-read one-liners in `package.json`. codesweep lets you declare the whole pipeline in one YAML file, mixing sequential and parallel stages freely, and run it with a single command.

It is built for "run all quality checks in one go" moments: post-task checks for AI coding agents, pre-commit hooks, and CI. Commands in a stage fail through — one failure doesn't cancel the other checks — so you see every error in a single run.

In short: if you need build caching and dependency graphs, reach for [wireit](https://www.npmjs.com/package/wireit); if you just want to run a couple of commands in parallel, `concurrently` alone is enough; if you want a declarative, multi-stage quality-check pipeline, codesweep is for you.

## Requirements

- Node.js >= 22 (or Bun >= 1)

## Install

```bash
# npm
npm install @tzwzx/codesweep

# bun
bun add @tzwzx/codesweep

# pnpm
pnpm add @tzwzx/codesweep
```

After install, the `codesweep` binary is available via `npx @tzwzx/codesweep`, `bunx @tzwzx/codesweep`, or `./node_modules/.bin/codesweep`.

## CLI usage

```bash
codesweep <command> [options]
```

- **`init`** — Create a starter `codesweep.yml` in the current directory. Reserved as a subcommand; see note below.
- **mode** — Any mode defined in `codesweep.yml` (for example `check` or `fix`).
- **`--config` / `-c <path>`** — Path to the config file (default: `./codesweep.yml`).
- **`--help` / `-h`** — Show help.

Examples:

```bash
codesweep init
codesweep check
codesweep fix
codesweep check --config ./packages/app/codesweep.yml
```

Exit code `0` on success, `1` on failure. Elapsed time is printed when the run finishes.

## Library usage

codesweep can also be called programmatically: `import { codesweep } from "@tzwzx/codesweep"` and `await codesweep("check")` (optionally passing a config path as the second argument).

## Config: `codesweep.yml`

Run `init` to generate a starter `codesweep.yml` in the current directory (fails if the file already exists). This also works without installing first:

```bash
npx @tzwzx/codesweep init

# or with bun
bunx @tzwzx/codesweep init
```

This creates:

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

Define one or more **modes**. Each mode is an ordered list of **stages**. Each stage is either `parallel` or `sequential`, and holds a non-empty array of shell command strings. Mode names are arbitrary — note: `"init"` is reserved as a subcommand and cannot be used as a mode name.

### Behavior

- **Stages** run one after another (stage 2 starts after stage 1 finishes).
- **Within a stage**, `parallel` runs commands concurrently; `sequential` runs them in order.
- **Fail-through**: If one command in a stage fails, other commands in that stage still run; the stage then fails as a whole.

### Validation rules

- The config must be a non-empty object.
- Each mode’s value must be an array of stages.
- Each stage must have exactly one of `parallel` or `sequential` (not both).
- Command lists must be non-empty arrays of non-empty strings.

## Development

```bash
bun install
bun run build   # outputs to dist/
bun run dev     # tsc --watch
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## License

MIT — see [LICENSE](LICENSE).
