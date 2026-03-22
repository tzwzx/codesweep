# codesweep

Run lint, format, typecheck, test, and other code quality commands in one go. Configure each project with a YAML file.

## Requirements

- Node.js >= 18 (or Bun >= 1)

## Install from Git

```bash
# npm
npm install github:tazawa/codesweep

# bun
bun add github:tazawa/codesweep

# pnpm
pnpm add github:tazawa/codesweep
```

After install, the `codesweep` binary is available via `npx codesweep`, `bunx codesweep`, or `./node_modules/.bin/codesweep`.

## CLI usage

```bash
codesweep <mode> [options]
```

- **mode** — Any mode defined in `codesweep.yml` (for example `check` or `fix`).
- **`--config` / `-c <path>`** — Path to the config file (default: `./codesweep.yml`).
- **`--help` / `-h`** — Show help.

Examples:

```bash
codesweep check
codesweep fix
codesweep check --config ./packages/app/codesweep.yml
```

Exit code `0` on success, `1` on failure. Elapsed time is printed when the run finishes.

## Library usage

```ts
import { codesweep } from "codesweep";

await codesweep("check");
await codesweep("fix", "./custom.yml");
```

You can also import helpers such as `loadConfig`, `runParallel`, and `runSequential` from the same package.

## Config: `codesweep.yml`

Define one or more **modes**. Each mode is an ordered list of **stages**. Each stage is either `parallel` or `sequential`, and holds a non-empty array of shell command strings.

Example:

```yaml
check:
  - parallel:
      - bun lint
      - bun tsc
      - bun test

fix:
  - sequential:
      - bun fix
  - parallel:
      - bun tsc
      - bun test
```

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

This repo keeps `dist/` in version control so consumers can depend on the Git URL without a build step on install.

## License

MIT — see [LICENSE](LICENSE).
