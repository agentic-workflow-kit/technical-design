import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  loadConfig,
  discoverCaseIds,
  resolveCaseManifest,
} from "@agentic-workflow-kit/eval-kit";

const __filename = fileURLToPath(import.meta.url);
const packageRoot = path.resolve(path.dirname(__filename), "..");
const repoRoot = path.resolve(packageRoot, "../..");
const configPath = path.join(repoRoot, "evals", "eval-kit.config.json");

const expectedCaseIds = [
  "case-aerial-delivery-shipping-v1",
  "case-cloudevents-core-contract-v1",
  "case-customer-credit-order-saga-v1",
  "case-fineract-loan-lifecycle-v1",
  "case-kubernetes-sidecar-containers-v1",
  "case-openfeature-evaluation-api-v1",
  "case-tiny-laundry-pickup-v1",
];

const expectedArtifacts = [
  { role: "generation_visible", path: "product.md" },
  { role: "generation_visible", path: "source-map.md" },
  { role: "grader_input", path: "expected-facts.json" },
  { role: "grader_input", path: "expected-boundaries.json" },
  { role: "semantic_reference", path: "reference-design.md" },
  { role: "semantic_reference", path: "rubric.md" },
  { role: "maintainer_only", path: "grader-notes.md" },
  { role: "provenance", path: "provenance.md" },
];

describe("technical-design case manifest resolver", () => {
  it("uses the simplified consumer config surface", () => {
    const config = loadConfig(configPath);

    expect(config.raw.adapter).toBe("adapter.mjs");
    expect(config.raw.schema_roots).toBeUndefined();
    expect(config.raw.case_manifests).toBeUndefined();
    expect(config.raw.cases).toEqual({
      root: "cases",
      include: ["case-*-v1"],
    });
    expect(config.raw.methods.deterministic).toEqual({
      enabled: true,
      grader: "facts-boundaries",
      reporter: "markdown",
    });
    expect(config.raw.methods.judge_coverage).toEqual({
      enabled: true,
      prompt: "@eval-kit/pointwise",
      rubric: "case:rubric.md",
    });
    expect(config.raw.methods.judge_pairwise).toEqual({
      enabled: false,
    });
  });

  it("discovers all expected case ids from manifests", () => {
    const config = loadConfig(configPath);
    const manifestCaseIds = discoverCaseIds(config);
    expect(manifestCaseIds).toEqual(expectedCaseIds);
  });

  it("resolves manifest-backed cases to the fixed case directory artifacts", () => {
    const config = loadConfig(configPath);
    for (const caseId of expectedCaseIds) {
      const resolved = resolveCaseManifest(config, caseId);

      expect(resolved.caseId).toBe(caseId);
      expect(resolved.manifest.schema_version).toBe(
        "technical-design.case-manifest.v1",
      );
      expect(resolved.manifest.artifacts).toEqual(expectedArtifacts);
      expect(resolved.manifest.grading).toEqual({
        grader: "technical-design-facts-boundaries",
        co_located_boundaries: true,
        allow_reference_design_as_ground_truth: false,
      });
      expect(resolved.manifest.grounding).toEqual({
        source_ref_allowlist: ["product.md", "source-map.md"],
      });
      expect(resolved.caseDir).toBe(
        path.join(repoRoot, "evals", "cases", caseId),
      );
      expect(resolved.artifacts.map((artifact) => artifact.path)).toEqual(
        expectedArtifacts.map((artifact) => artifact.path),
      );
    }
  });
});
