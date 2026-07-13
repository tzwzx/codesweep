# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.2] - 2026-07-13

### Changed

- Maintenance release with no user-facing changes: replaced knip with fallow for unused-code analysis, added cspell and lefthook for spellcheck and pre-commit checks, and split CLI/config modules to satisfy complexity thresholds. Runtime behavior is unchanged.

## [1.1.1] - 2026-07-10

### Changed

- Maintenance release with no user-facing changes: refreshed dev dependencies (TypeScript 7, knip, oxlint, oxfmt, ultracite). Runtime behavior is unchanged.

## [1.1.0] - 2026-07-02

### Added

- `codesweep init` subcommand that generates a starter `codesweep.yml` in the current directory. `init` is a reserved subcommand and cannot be used as a mode name.

### Changed

- Improved README: added a "Why codesweep?" section, one-step usage via `npx` / `bunx`, and a slimmer library usage section.

## [1.0.1] - 2026-07-01

### Changed

- Maintenance release with no user-facing changes: refreshed dev dependencies and simplified the lint/format/knip ignore configuration. Runtime behavior is unchanged.

## [1.0.0] - 2026-07-01

### Added

- Initial release.
- `codesweep <mode>` CLI that runs the stages defined for a mode in `codesweep.yml`.
- Mode-based pipeline: each mode is an ordered list of `parallel` or `sequential` stages, run one stage after another with fail-through within a stage.
- `--config` / `-c` option to point at a custom config file, and `--help` / `-h`.
- Library API: `codesweep`, `loadConfig`, `runParallel`, `runSequential`, and the `isParallelStage` / `isSequentialStage` type guards.

[Unreleased]: https://github.com/tzwzx/codesweep/compare/v1.1.2...HEAD
[1.1.2]: https://github.com/tzwzx/codesweep/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/tzwzx/codesweep/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/tzwzx/codesweep/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/tzwzx/codesweep/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/tzwzx/codesweep/releases/tag/v1.0.0
