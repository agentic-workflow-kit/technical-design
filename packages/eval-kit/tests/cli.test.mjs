import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const __filename = fileURLToPath(import.meta.url);
const packageRoot = path.resolve(path.dirname(__filename), "..");
const repoRoot = path.resolve(packageRoot, "../..");
const configPath = path.join(repoRoot, "evals", "eval-kit.config.json");
const cliPath = path.resolve(packageRoot, "bin/eval-kit.mjs");

describe("eval-kit CLI", () => {
  it("fails closed when pairwise judging is disabled by config", () => {
    const result = spawnSync(
      process.execPath,
      [cliPath, "judge-pairwise", "--config", configPath],
      {
        cwd: packageRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("judge-pairwise is disabled");
  });
});
