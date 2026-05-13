/**
 * codesweep - YAML config loading and validation
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";
const DEFAULT_CONFIG_FILENAME = "codesweep.yml";
export const isParallelStage = (stage) => "parallel" in stage;
export const isSequentialStage = (stage) => "sequential" in stage;
const validateStage = (stage, modeName, index) => {
    if (typeof stage !== "object" || stage === null) {
        throw new Error(`${modeName}[${index}]: Stage must be an object`);
    }
    const record = stage;
    const hasParallel = "parallel" in record;
    const hasSequential = "sequential" in record;
    if (!hasParallel && !hasSequential) {
        throw new Error(`${modeName}[${index}]: Stage must have a "parallel" or "sequential" key`);
    }
    if (hasParallel && hasSequential) {
        throw new Error(`${modeName}[${index}]: Stage cannot have both "parallel" and "sequential"`);
    }
    const commands = hasParallel ? record.parallel : record.sequential;
    if (!Array.isArray(commands) || commands.length === 0) {
        throw new Error(`${modeName}[${index}]: Command list must be a non-empty array`);
    }
    for (const command of commands) {
        if (typeof command !== "string" || command.trim() === "") {
            throw new Error(`${modeName}[${index}]: Each command must be a non-empty string`);
        }
    }
};
const validateConfig = (config) => {
    if (typeof config !== "object" || config === null || Array.isArray(config)) {
        throw new Error("Config file must be an object");
    }
    const record = config;
    const modes = Object.keys(record);
    if (modes.length === 0) {
        throw new Error("Config must define at least one mode");
    }
    for (const mode of modes) {
        const stages = record[mode];
        if (!Array.isArray(stages)) {
            throw new TypeError(`"${mode}": Stage list must be an array`);
        }
        for (const [index, stage] of stages.entries()) {
            validateStage(stage, mode, index);
        }
    }
    return record;
};
export const loadConfig = (configPath) => {
    const resolvedPath = configPath
        ? resolve(configPath)
        : resolve(process.cwd(), DEFAULT_CONFIG_FILENAME);
    let content;
    try {
        content = readFileSync(resolvedPath, "utf-8");
    }
    catch {
        throw new Error(`Config file not found: ${resolvedPath}`);
    }
    const parsed = parse(content);
    return validateConfig(parsed);
};
//# sourceMappingURL=config.js.map