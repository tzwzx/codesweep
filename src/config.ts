import { readFileSync } from "node:fs";
import path from "node:path";

import { parse } from "yaml";

import type { ParallelStage, SequentialStage, Stage, CodesweepConfig } from "./types.js";

const DEFAULT_CONFIG_FILENAME = "codesweep.yml";

export const isParallelStage = (stage: Stage): stage is ParallelStage => "parallel" in stage;

export const isSequentialStage = (stage: Stage): stage is SequentialStage => "sequential" in stage;

const assertStageObject = (
  stage: unknown,
  modeName: string,
  index: number,
): Record<string, unknown> => {
  if (typeof stage !== "object" || stage === null) {
    throw new Error(`${modeName}[${index}]: Stage must be an object`);
  }
  return stage as Record<string, unknown>;
};

const resolveStageCommands = (
  record: Record<string, unknown>,
  modeName: string,
  index: number,
): unknown => {
  const hasParallel = "parallel" in record;
  const hasSequential = "sequential" in record;

  if (!(hasParallel || hasSequential)) {
    throw new Error(`${modeName}[${index}]: Stage must have a "parallel" or "sequential" key`);
  }

  if (hasParallel && hasSequential) {
    throw new Error(`${modeName}[${index}]: Stage cannot have both "parallel" and "sequential"`);
  }

  return hasParallel ? record.parallel : record.sequential;
};

const assertCommandList = (commands: unknown, modeName: string, index: number): void => {
  if (!Array.isArray(commands) || commands.length === 0) {
    throw new Error(`${modeName}[${index}]: Command list must be a non-empty array`);
  }

  for (const command of commands) {
    if (typeof command !== "string" || command.trim() === "") {
      throw new Error(`${modeName}[${index}]: Each command must be a non-empty string`);
    }
  }
};

const validateStage = (stage: unknown, modeName: string, index: number): void => {
  const record = assertStageObject(stage, modeName, index);
  assertCommandList(resolveStageCommands(record, modeName, index), modeName, index);
};

const assertConfigObject = (config: unknown): Record<string, unknown> => {
  if (typeof config !== "object" || config === null || Array.isArray(config)) {
    throw new Error("Config file must be an object");
  }
  return config as Record<string, unknown>;
};

const validateModeStages = (mode: string, stages: unknown): void => {
  if (!Array.isArray(stages)) {
    throw new TypeError(`"${mode}": Stage list must be an array`);
  }

  for (const [index, stage] of stages.entries()) {
    validateStage(stage, mode, index);
  }
};

const validateConfig = (config: unknown): CodesweepConfig => {
  const record = assertConfigObject(config);
  const modes = Object.keys(record);

  if (modes.length === 0) {
    throw new Error("Config must define at least one mode");
  }

  for (const mode of modes) {
    validateModeStages(mode, record[mode]);
  }

  return record as CodesweepConfig;
};

export const resolveConfigPath = (configPath?: string): string =>
  configPath ? path.resolve(configPath) : path.resolve(process.cwd(), DEFAULT_CONFIG_FILENAME);

export const loadConfig = (configPath?: string): CodesweepConfig => {
  const resolvedPath = resolveConfigPath(configPath);

  let content: string;
  try {
    content = readFileSync(resolvedPath, "utf-8");
  } catch {
    throw new Error(`Config file not found: ${resolvedPath}`);
  }

  const parsed = parse(content) as unknown;
  return validateConfig(parsed);
};
