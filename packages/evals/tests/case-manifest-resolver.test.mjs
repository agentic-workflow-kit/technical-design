import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  discoverLegacyCaseIds,
  discoverManifestCaseIds,
  resolveCaseManifest,
} from "../src/adapters/technical-design/case-manifest-resolver.mjs";
import { packageRoot } from "../src/lib/paths.mjs";

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
  it("discovers the same seven case ids from legacy directories and manifests", () => {
    const legacyCaseIds = discoverLegacyCaseIds();
    const manifestCaseIds = discoverManifestCaseIds();

    expect(legacyCaseIds).toEqual(expectedCaseIds);
    expect(manifestCaseIds).toEqual(expectedCaseIds);
    expect(manifestCaseIds).toEqual(legacyCaseIds);
  });

  it("resolves manifest-backed cases to the fixed case directory artifacts", () => {
    for (const caseId of expectedCaseIds) {
      const resolved = resolveCaseManifest(caseId);

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
        path.join(packageRoot, "fixtures", "cases", caseId),
      );
      expect(resolved.artifacts.map((artifact) => artifact.path)).toEqual(
        expectedArtifacts.map((artifact) => artifact.path),
      );
    }
  });
});
