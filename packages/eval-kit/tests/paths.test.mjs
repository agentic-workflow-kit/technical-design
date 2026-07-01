import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { assertSafeId, createPathResolver } from "../src/index.mjs";

describe("eval-kit path helpers", () => {
  it("rejects path-shaped ids", () => {
    expect(assertSafeId("case-a", "case id")).toBe("case-a");
    expect(() => assertSafeId("../case-a", "case id")).toThrow("must be an id");
    expect(() => assertSafeId("nested/case", "case id")).toThrow(
      "must be an id",
    );
  });

  it("contains suite, result, run, and artifact paths", () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "eval-kit-paths-"));
    const resolver = createPathResolver({
      repoRoot,
      configDir: repoRoot,
      suiteRoot: "suites/example",
      resultsRoot: "suites/example/results",
    });
    const runDir = resolver.resolveRunDir("run-001");

    expect(resolver.relativeToRepo(runDir)).toBe(
      "suites/example/results/run-001",
    );
    expect(() => resolver.resolveRunDir("../run-001")).toThrow("must be an id");
    expect(() =>
      resolver.resolveResultArtifact(runDir, "../manifest.json", "artifact"),
    ).toThrow(/escapes/);
  });
});
