import fs from "node:fs";
import os from "node:os";
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

const writeJson = (filePath, value) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
};

const writeText = (filePath, value) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
};

const createTempSuite = ({ caseId, artifactPath }) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "eval-kit-case-"));
  const configFile = path.join(root, "evals", "eval-kit.config.json");
  const caseDir = path.join(root, "evals", "cases", caseId);

  writeJson(configFile, {
    schema_version: "eval-kit.config.v1",
    suite_id: "test-suite",
    suite_root: ".",
    results_root: "results",
    adapter: "adapter.mjs",
    cases: {
      root: "cases",
      include: ["case-*"],
    },
    methods: {},
  });
  writeJson(path.join(caseDir, "case-manifest.json"), {
    schema_version: "test.case-manifest.v1",
    case_id: caseId,
    artifacts: [{ role: "input", path: artifactPath }],
  });
  return { configFile, caseDir };
};

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

  it("rejects manifest artifact paths that escape the case directory", () => {
    const { configFile } = createTempSuite({
      caseId: "case-escape",
      artifactPath: "../outside.json",
    });
    writeText(
      path.join(path.dirname(configFile), "cases", "outside.json"),
      "{}\n",
    );
    const config = loadConfig(configFile);

    expect(() => resolveCaseManifest(config, "case-escape")).toThrow(
      /case artifact \.\.\/outside\.json escapes/,
    );
  });

  it("rejects absolute manifest artifact paths", () => {
    const caseId = "case-absolute";
    const temp = createTempSuite({
      caseId,
      artifactPath: "placeholder.md",
    });
    const absoluteArtifactPath = path.join(temp.caseDir, "product.md");
    writeText(absoluteArtifactPath, "product\n");
    writeJson(path.join(temp.caseDir, "case-manifest.json"), {
      schema_version: "test.case-manifest.v1",
      case_id: caseId,
      artifacts: [{ role: "input", path: absoluteArtifactPath }],
    });
    const config = loadConfig(temp.configFile);

    expect(() => resolveCaseManifest(config, caseId)).toThrow(
      /case artifact .* must be relative/,
    );
  });
});
