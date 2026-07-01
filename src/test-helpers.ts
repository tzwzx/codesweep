import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/** Create a temporary YAML config file for testing */
export const createTempConfig = (content: string, prefix = "codesweep-test-"): string => {
  const dir = mkdtempSync(path.join(tmpdir(), prefix));
  const filePath = path.join(dir, "codesweep.yml");
  writeFileSync(filePath, content, "utf-8");
  return filePath;
};
