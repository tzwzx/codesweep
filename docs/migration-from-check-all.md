# Migration Guide: check-all to codesweep

Steps to replace `scripts/check-all.ts` + `check-all.yml` with the codesweep package.

## Migration Steps

### 1. Install codesweep

```bash
bun add -D github:username/codesweep
```

### 2. Convert check-all.yml to codesweep.yml

#### Before: check-all.yml

```yaml
# 3 fixed groups
parallel_check_commands:
  - bun lint

sequential_format_commands:
  - bun fix

parallel_common_check_commands:
  - bun syncpack
  - bun tsc
  - bun knip
  - bun test:unit
```

#### After: codesweep.yml

```yaml
# Mode-based pipeline
check:
  - parallel:
      - bun lint
      - bun syncpack
      - bun tsc
      - bun knip
      - bun test:unit

fix:
  - sequential:
      - bun fix
  - parallel:
      - bun syncpack
      - bun tsc
      - bun knip
      - bun test:unit
```

#### Conversion Rules

| check-all.yml group              | codesweep.yml placement                           |
| -------------------------------- | ------------------------------------------------- |
| `parallel_check_commands`        | Add to `parallel` stage in `check` mode           |
| `sequential_format_commands`     | Add as `sequential` stage in `fix` mode           |
| `parallel_common_check_commands` | Add to `parallel` stage in both `check` and `fix` |

### 3. Update package.json scripts

#### Before

```json
{
  "scripts": {
    "check-all": "bun scripts/check-all.ts",
    "check-all:fix": "bun scripts/check-all.ts fix"
  }
}
```

#### After

```json
{
  "scripts": {
    "codesweep": "codesweep check",
    "codesweep:fix": "codesweep fix"
  }
}
```

### 4. Update CLAUDE.md (for AI agents)

#### Before

```markdown
- After completing the task, run `bun check-all:fix`, and if any errors appear, fix them.
```

#### After

```markdown
- After completing the task, run `bun codesweep:fix`, and if any errors appear, fix them.
```

### 5. Remove Obsolete Files

Delete the following files:

- `scripts/check-all.ts`
- `check-all.yml`

### 6. Remove Unused Dependencies

If these were installed only for check-all.ts, remove them:

```bash
bun remove concurrently yaml
```

※ Keep them if used by other scripts.

## Verification

```bash
# Check mode (equivalent to bun check-all)
bun codesweep

# Fix mode (equivalent to bun check-all:fix)
bun codesweep:fix
```

## Behavioral Differences

### Results are equivalent, but the following are improved

| Item             | check-all                | codesweep                           |
| ---------------- | ------------------------ | ----------------------------------- |
| Output           | `All checks completed`   | `✅ codesweep check passed (1.23s)` |
| Mode display     | None                     | Shows current mode name             |
| Invalid config   | Crashes during execution | Validation error at startup         |
| Config file path | Fixed                    | Customizable via `--config`         |

## Rollback

If issues arise:

1. Restore `scripts/check-all.ts` and `check-all.yml` from git
2. Revert `package.json` scripts
3. `bun remove codesweep`
