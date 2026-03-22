/**
 * codesweep - YAML config loading and validation
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";
const DEFAULT_CONFIG_FILENAME = "codesweep.yml";
/** Check if a stage is a parallel stage */
export const isParallelStage = (stage) => "parallel" in stage;
/** Check if a stage is a sequential stage */
export const isSequentialStage = (stage) => "sequential" in stage;
/** Validate a single stage */
const validateStage = (stage, modeName, index) => {
    if (typeof stage !== "object" || stage === null) {
        throw new Error(`${modeName}[${index}]: Stage must be an object`);
    }
    const stageObj = stage;
    const hasParallel = "parallel" in stageObj;
    const hasSequential = "sequential" in stageObj;
    if (!hasParallel && !hasSequential) {
        throw new Error(`${modeName}[${index}]: Stage must have a "parallel" or "sequential" key`);
    }
    if (hasParallel && hasSequential) {
        throw new Error(`${modeName}[${index}]: Stage cannot have both "parallel" and "sequential"`);
    }
    const commands = hasParallel ? stageObj.parallel : stageObj.sequential;
    if (!Array.isArray(commands) || commands.length === 0) {
        throw new Error(`${modeName}[${index}]: Command list must be a non-empty array`);
    }
    for (const command of commands) {
        if (typeof command !== "string" || command.trim() === "") {
            throw new Error(`${modeName}[${index}]: Each command must be a non-empty string`);
        }
    }
};
/** Validate the entire config */
const validateConfig = (config) => {
    if (typeof config !== "object" || config === null || Array.isArray(config)) {
        throw new Error("Config file must be an object");
    }
    const configObj = config;
    const modes = Object.keys(configObj);
    // At least one mode must be defined
    if (modes.length === 0) {
        throw new Error("Config must define at least one mode");
    }
    for (const mode of modes) {
        const stages = configObj[mode];
        if (!Array.isArray(stages)) {
            throw new TypeError(`"${mode}": Stage list must be an array`);
        }
        for (const [index, stage] of stages.entries()) {
            validateStage(stage, mode, index);
        }
    }
    return configObj;
};
/** Load and parse the config file */
export const loadConfig = (configPath) => {
    const resolvedPath = configPath
        ? resolve(configPath)
        : resolve(process.cwd(), DEFAULT_CONFIG_FILENAME);
    let content;
    try {
        content = readFileSync(resolvedPath, "utf8");
    }
    catch {
        throw new Error(`Config file not found: ${resolvedPath}`);
    }
    const parsed = parse(content);
    return validateConfig(parsed);
};
//# sourceMappingURL=config.js.map