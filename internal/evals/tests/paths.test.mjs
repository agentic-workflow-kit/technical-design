import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  assertSafeId,
  relativeToPackage,
  resolveRepoInputPath,
  resolveRunDir,
} from "../src/lib/paths.mjs";

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

  it("keeps run directories under internal eval results", () => {
    const runDir = resolveRunDir("pilot-001");
    expect(relativeToPackage(runDir)).toBe("results/pilot-001");
    expect(() => resolveRunDir("../pilot-001")).toThrow("must be an id");
  });

  it("rejects repo input paths outside the repository", () => {
    const inside = resolveRepoInputPath(
      "internal/evals/fixtures/cases/README.md",
      "candidate path",
    );
    expect(inside.endsWith(path.join("fixtures", "cases", "README.md"))).toBe(
      true,
    );
    expect(() =>
      resolveRepoInputPath("/tmp/outside.md", "candidate path"),
    ).toThrow(/escapes/);
  });
});
