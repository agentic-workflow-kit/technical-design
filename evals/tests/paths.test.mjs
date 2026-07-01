import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { loadConfig, assertSafeId } from "@agentic-workflow-kit/eval-kit";

const __filename = fileURLToPath(import.meta.url);
const packageRoot = path.resolve(path.dirname(__filename), "..");
const configPath = path.join(packageRoot, "eval-kit.config.json");

describe("eval path helpers", () => {
  it("accepts simple ids and rejects path-shaped ids", () => {
    expect(assertSafeId("case-tiny-laundry-pickup-v1", "case id")).toBe(
      "case-tiny-laundry-pickup-v1",
    );
    expect(() => assertSafeId("../outside", "run id")).toThrow("must be an id");
    expect(() => assertSafeId("nested/path", "run id")).toThrow(
      "must be an id",
    );
  });

  it("keeps run directories under package eval results", () => {
    const config = loadConfig(configPath);
    const resolver = config.pathResolver;
    const runDir = resolver.resolveRunDir("pilot-001");
    expect(resolver.relativeToResults(runDir)).toBe("pilot-001");
    expect(() => resolver.resolveRunDir("../pilot-001")).toThrow(
      "must be an id",
    );
  });

  it("rejects repo input paths outside the repository", () => {
    const config = loadConfig(configPath);
    const resolver = config.pathResolver;
    const inside = resolver.resolveRepoPath(
      "evals/fixtures/cases/README.md",
      "candidate path",
    );
    expect(inside.endsWith(path.join("fixtures", "cases", "README.md"))).toBe(
      true,
    );
    expect(() =>
      resolver.resolveRepoPath("../outside.md", "candidate path"),
    ).toThrow(/escapes/);
  });
});
