# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/tzwzx/codesweep/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/tzwzx/codesweep/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/tzwzx/codesweep/releases/tag/v1.0.0
