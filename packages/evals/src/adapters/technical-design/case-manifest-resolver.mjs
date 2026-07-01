import fs from "node:fs";
import path from "node:path";

import {
  assertContainedPath,
  assertSafeId,
  createPathResolver,
} from "@agentic-workflow-kit/eval-kit";

import { packageRoot, repoRoot } from "../../lib/paths.mjs";

const caseManifestSchemaVersion = "technical-design.case-manifest.v1";
const defaultConfigPath = path.join(packageRoot, "eval-kit.config.json");
const defaultCasesDir = path.join(packageRoot, "fixtures", "cases");

const requiredLegacyArtifacts = [
  "product.md",
  "source-map.md",
  "reference-design.md",
  "expected-facts.json",
  "expected-boundaries.json",
  "rubric.md",
  "grader-notes.md",
  "provenance.md",
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

const expectedGrading = {
  grader: "technical-design-facts-boundaries",
  co_located_boundaries: true,
  allow_reference_design_as_ground_truth: false,
};

const expectedGrounding = {
  source_ref_allowlist: ["product.md", "source-map.md"],
};

const sorted = (values) => [...values].sort((a, b) => a.localeCompare(b));

const readJsonFile = (filePath, label) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`failed to read ${label}: ${error.message}`);
  }
};

const assertObject = (value, label) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
};

const artifactKey = (artifact) => `${artifact.role}:${artifact.path}`;

const assertExactArtifacts = (artifacts, label) => {
  if (!Array.isArray(artifacts)) {
    throw new Error(`${label}.artifacts must be an array`);
  }

  const actual = sorted(artifacts.map(artifactKey));
  const expected = sorted(expectedArtifacts.map(artifactKey));

  if (
    actual.length !== expected.length ||
    actual.some((value, index) => value !== expected[index])
  ) {
    throw new Error(
      `${label}.artifacts must match the technical-design case artifact contract`,
    );
  }
};

const equalJsonValue = (actual, expected) => {
  if (Array.isArray(actual) || Array.isArray(expected)) {
    return (
      Array.isArray(actual) &&
      Array.isArray(expected) &&
      actual.length === expected.length &&
      actual.every((value, index) => equalJsonValue(value, expected[index]))
    );
  }
  if (
    actual &&
    expected &&
    typeof actual === "object" &&
    typeof expected === "object"
  ) {
    const actualKeys = sorted(Object.keys(actual));
    const expectedKeys = sorted(Object.keys(expected));
    return (
      actualKeys.length === expectedKeys.length &&
      actualKeys.every((key, index) => key === expectedKeys[index]) &&
      actualKeys.every((key) => equalJsonValue(actual[key], expected[key]))
    );
  }
  return actual === expected;
};

const assertExactObject = (actual, expected, label) => {
  assertObject(actual, label);
  if (!equalJsonValue(actual, expected)) {
    throw new Error(`${label} must match the technical-design case contract`);
  }
};

const resolveCasesDir = (casesDir) =>
  assertContainedPath(
    packageRoot,
    path.resolve(casesDir),
    "technical-design cases directory",
  );

const readSuiteConfig = (configPath) => {
  const resolvedConfigPath = assertContainedPath(
    packageRoot,
    path.resolve(configPath),
    "eval-kit config",
  );
  const config = readJsonFile(resolvedConfigPath, "eval-kit config");
  assertObject(config, "eval-kit config");
  if (config.schema_version !== "eval-kit.config.v1") {
    throw new Error(
      "eval-kit config schema_version must be eval-kit.config.v1",
    );
  }
  if (!Array.isArray(config.case_manifests)) {
    throw new Error("eval-kit config case_manifests must be an array");
  }
  return { config, configPath: resolvedConfigPath };
};

const manifestPathsFromConfig = (configPath = defaultConfigPath) => {
  const { config, configPath: resolvedConfigPath } =
    readSuiteConfig(configPath);
  const resolver = createPathResolver({
    repoRoot,
    suiteRoot: config.suite_root,
    resultsRoot: config.results_root,
    configDir: path.dirname(resolvedConfigPath),
  });

  return config.case_manifests.map((manifestPath) =>
    resolver.resolveSuitePath(manifestPath, "case manifest"),
  );
};

const resolveManifestFile = (manifestPath) => {
  const resolvedManifestPath = assertContainedPath(
    defaultCasesDir,
    path.resolve(manifestPath),
    "case manifest",
  );
  const caseDir = assertContainedPath(
    defaultCasesDir,
    path.dirname(resolvedManifestPath),
    "case manifest directory",
  );
  const manifest = readJsonFile(resolvedManifestPath, "case manifest");
  assertObject(manifest, "case manifest");

  if (manifest.schema_version !== caseManifestSchemaVersion) {
    throw new Error(
      `case manifest schema_version must be ${caseManifestSchemaVersion}`,
    );
  }
  assertSafeId(manifest.case_id, "case manifest case_id");
  if (path.basename(caseDir) !== manifest.case_id) {
    throw new Error("case manifest case_id must match its case directory");
  }

  assertExactArtifacts(manifest.artifacts, "case manifest");
  assertExactObject(manifest.grading, expectedGrading, "case manifest.grading");
  assertExactObject(
    manifest.grounding,
    expectedGrounding,
    "case manifest.grounding",
  );

  const artifacts = manifest.artifacts.map((artifact) => {
    const artifactPath = assertContainedPath(
      caseDir,
      path.resolve(caseDir, artifact.path),
      `case artifact ${artifact.path}`,
    );
    if (!fs.existsSync(artifactPath)) {
      throw new Error(`case artifact does not exist: ${artifact.path}`);
    }
    return { ...artifact, absolutePath: artifactPath };
  });

  return {
    caseId: manifest.case_id,
    caseDir,
    manifestPath: resolvedManifestPath,
    manifest,
    artifacts,
  };
};

export const discoverLegacyCaseIds = (options = {}) => {
  const casesDir = resolveCasesDir(options.casesDir ?? defaultCasesDir);
  if (!fs.existsSync(casesDir)) {
    return [];
  }

  return sorted(
    fs
      .readdirSync(casesDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .filter((entry) =>
        requiredLegacyArtifacts.every((fileName) =>
          fs.existsSync(path.join(casesDir, entry.name, fileName)),
        ),
      )
      .map((entry) => entry.name),
  );
};

export const discoverManifestCaseIds = (options = {}) =>
  sorted(
    manifestPathsFromConfig(options.configPath ?? defaultConfigPath).map(
      (manifestPath) => resolveManifestFile(manifestPath).caseId,
    ),
  );

export const resolveCaseManifest = (caseId, options = {}) => {
  const safeCaseId = assertSafeId(caseId, "case id");
  const resolved = manifestPathsFromConfig(
    options.configPath ?? defaultConfigPath,
  )
    .map((manifestPath) => resolveManifestFile(manifestPath))
    .find((manifest) => manifest.caseId === safeCaseId);

  if (!resolved) {
    throw new Error(`case manifest not found for ${safeCaseId}`);
  }
  return resolved;
};
