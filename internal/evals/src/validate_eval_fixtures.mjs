#!/usr/bin/env node
import Ajv2020 from "ajv/dist/2020.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { packageRoot, repoRoot } from "./lib/paths.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localPackageRoot = path.resolve(__dirname, "..");

if (localPackageRoot !== packageRoot) {
  throw new Error(
    "eval package path helper resolved an unexpected package root",
  );
}

const failures = [];
const ajv = new Ajv2020({ allErrors: true, strict: false });

const repoRelativeRoots = new Set([
  "docs",
  "methodologies",
  "scripts",
  "skills",
]);

const resolveRelativePath = (relativePath) => {
  if (path.isAbsolute(relativePath)) {
    return relativePath;
  }
  const rootName = String(relativePath).split(/[\\/]/)[0];
  const base = repoRelativeRoots.has(rootName) ? repoRoot : packageRoot;
  return path.resolve(base, relativePath);
};

const relative = (absolutePath) =>
  path.relative(repoRoot, absolutePath).split(path.sep).join("/");

const readText = (relativePath) => {
  const absolutePath = resolveRelativePath(relativePath);
  try {
    return fs.readFileSync(absolutePath, "utf8");
  } catch (error) {
    failures.push(`failed to read ${relativePath}: ${error.message}`);
    return "";
  }
};

const readJson = (relativePath) => {
  const text = readText(relativePath);
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    failures.push(`failed to parse ${relativePath}: ${error.message}`);
    return null;
  }
};

const assert = (condition, message) => {
  if (!condition) {
    failures.push(message);
  }
};

const asPath = (baseRelativePath, childRelativePath) => {
  const base = resolveRelativePath(baseRelativePath);
  const resolved = path.resolve(base, childRelativePath);
  assert(
    resolved === base || resolved.startsWith(`${base}${path.sep}`),
    `${childRelativePath} escapes ${baseRelativePath}`,
  );
  return resolved;
};

const uniqueValues = (values) => new Set(values).size === values.length;

const sorted = (values) => [...values].sort((a, b) => a.localeCompare(b));

const normalizeWhitespace = (value) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

const includesNormalized = (text, expected) =>
  normalizeWhitespace(text).includes(normalizeWhitespace(expected));

const extractLessonIds = (ledgerText) =>
  new Set(
    [...ledgerText.matchAll(/\|\s+(LSN-\d{3})\s+\|/g)].map((match) => match[1]),
  );

const formatAjvPath = (instancePath) =>
  instancePath
    .replace(/^\//, "")
    .replaceAll("/", ".")
    .replace(/\.(\d+)(?=\.|$)/g, "[$1]");

const recordAjvErrors = (label, validate, data) => {
  const valid = validate(data);
  if (valid || !validate.errors) {
    return valid;
  }

  for (const error of validate.errors) {
    const basePath = formatAjvPath(error.instancePath);
    const targetPath =
      error.keyword === "required"
        ? [basePath, error.params.missingProperty].filter(Boolean).join(".")
        : basePath;
    const subject = targetPath ? `${label}.${targetPath}` : label;
    failures.push(`${subject} ${error.message}`);
  }

  return false;
};

const validateNoBlankStrings = (value, label, options = {}) => {
  const allowBlankLabels = new Set(options.allowBlankLabels ?? []);
  if (typeof value === "string") {
    if (value.trim().length === 0 && !allowBlankLabels.has(label)) {
      failures.push(`${label} must not be blank`);
    }
    return;
  }
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      validateNoBlankStrings(item, `${label}[${index}]`, options);
    }
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      validateNoBlankStrings(item, `${label}.${key}`, options);
    }
  }
};

const reviewSuggestionSchema = readJson(
  "schemas/review-suggestion.schema.json",
);
const expectedSuggestionsSchema = readJson(
  "schemas/expected-suggestions.schema.json",
);
const expectedDefectSuggestionSchema = readJson(
  "schemas/expected-defect-suggestion.schema.json",
);
const defectManifestSchema = readJson("schemas/defect-manifest.schema.json");
const expectedSuggestions = readJson(
  "fixtures/review/expected-suggestions.json",
);
const defectManifest = readJson("fixtures/ddd/defect-manifest.json");
const lessonsLedger = readText("docs/design/lessons-ledger.md");
const dddReviewRubric = readText("methodologies/ddd/review-rubric.md");
const authorSkill = readText("skills/author-technical-design/SKILL.md");

const lessonIds = extractLessonIds(lessonsLedger);

const registerSchema = (schema, label) => {
  assert(
    schema && typeof schema === "object",
    `${label} schema must be an object`,
  );
  if (!schema || typeof schema !== "object") {
    return;
  }
  assert(typeof schema.$id === "string", `${label} schema must declare $id`);
  if (typeof schema.$id !== "string") {
    return;
  }
  ajv.addSchema(schema);
};

const validateLessonRef = (lessonRef, label) => {
  assert(typeof lessonRef === "string", `${label} must be a string`);
  if (typeof lessonRef !== "string") {
    return;
  }
  if (lessonRef !== "none") {
    assert(
      lessonIds.has(lessonRef),
      `${label} references unknown lesson ${lessonRef}`,
    );
  }
};

const validateRubricGateRef = (gateRef, label) => {
  assert(typeof gateRef === "string", `${label} must be a string`);
  if (typeof gateRef !== "string") {
    return "";
  }

  const prefix = "DDD review rubric: ";
  assert(gateRef.startsWith(prefix), `${label} must start with "${prefix}"`);
  const rubricSnippet = gateRef.slice(prefix.length);
  assert(rubricSnippet.trim().length > 0, `${label} must cite rubric text`);
  assert(
    dddReviewRubric.includes(rubricSnippet),
    `${label} references rubric text not found in methodologies/ddd/review-rubric.md`,
  );
  return rubricSnippet;
};

const rubricSeverityForSnippet = (snippet) => {
  let currentSeverity = "";
  for (const line of dddReviewRubric.split("\n")) {
    const trimmed = line.trim();
    if (trimmed === "Blocking findings:") {
      currentSeverity = "blocking";
      continue;
    }
    if (trimmed === "Recommended findings:") {
      currentSeverity = "recommended";
      continue;
    }
    if (
      trimmed.startsWith("- ") &&
      normalizeWhitespace(trimmed.slice(2)) === normalizeWhitespace(snippet)
    ) {
      return currentSeverity;
    }
  }
  return "";
};

registerSchema(reviewSuggestionSchema, "review suggestion");
registerSchema(expectedDefectSuggestionSchema, "expected defect suggestion");
registerSchema(expectedSuggestionsSchema, "expected suggestions");
registerSchema(defectManifestSchema, "defect manifest");

const validateExpectedSuggestionsShape = expectedSuggestionsSchema
  ? ajv.compile(expectedSuggestionsSchema)
  : null;
const validateDefectManifestShape = defectManifestSchema
  ? ajv.compile(defectManifestSchema)
  : null;

const compileSchema = (schema, label) => {
  if (!schema || typeof schema !== "object") {
    failures.push(`${label} schema must be an object`);
    return null;
  }
  try {
    if (schema.$id && ajv.getSchema(schema.$id)) {
      return ajv.getSchema(schema.$id);
    }
    return ajv.compile(schema);
  } catch (error) {
    failures.push(`${label} failed to compile: ${error.message}`);
    return null;
  }
};

const validateExpectedSuggestions = () => {
  const shapeIsValid = validateExpectedSuggestionsShape
    ? recordAjvErrors(
        "expected-suggestions",
        validateExpectedSuggestionsShape,
        expectedSuggestions,
      )
    : false;

  if (!Array.isArray(expectedSuggestions)) {
    return;
  }
  if (!shapeIsValid) {
    return;
  }

  const ids = expectedSuggestions.map((suggestion) => suggestion.id);
  assert(uniqueValues(ids), "expected suggestion ids must be unique");

  for (const [index, suggestion] of expectedSuggestions.entries()) {
    const label = `expected-suggestions[${index}]`;
    validateNoBlankStrings(suggestion, label, {
      allowBlankLabels: [`${label}.decision_ref`],
    });

    validateLessonRef(suggestion.lesson_ref, `${label}.lesson_ref`);
    const rubricSnippet = validateRubricGateRef(
      suggestion.gate_ref,
      `${label}.gate_ref`,
    );
    const rubricSeverity = rubricSeverityForSnippet(rubricSnippet);
    assert(
      rubricSeverity === suggestion.severity,
      `${label}.severity must match ${suggestion.gate_ref} (${rubricSeverity || "unknown rubric severity"})`,
    );
  }
};

const validateDefectManifest = () => {
  const initialDefectIds = [
    "invented-failure-token",
    "missing-context-ownership",
    "unresolved-required-input",
    "public-api-exposure-gap",
    "unsourced-invariant-operand",
    "vacuous-enforcement",
  ];

  const shapeIsValid = validateDefectManifestShape
    ? recordAjvErrors(
        "defect-manifest",
        validateDefectManifestShape,
        defectManifest,
      )
    : false;

  if (
    !defectManifest ||
    typeof defectManifest !== "object" ||
    Array.isArray(defectManifest)
  ) {
    return;
  }
  if (!Array.isArray(defectManifest.defects)) {
    return;
  }
  if (!shapeIsValid) {
    return;
  }

  validateNoBlankStrings(defectManifest, "defect-manifest");

  const ids = defectManifest.defects.map((defect) => defect.id);
  assert(uniqueValues(ids), "defect manifest ids must be unique");
  for (const defectId of initialDefectIds) {
    assert(ids.includes(defectId), `defect manifest must include ${defectId}`);
  }

  for (const [index, defect] of defectManifest.defects.entries()) {
    const label = `defect-manifest.defects[${index}]`;
    const fixturePath = asPath("fixtures/ddd", defect.file);

    assert(
      fs.existsSync(fixturePath),
      `${label}.file does not exist: ${relative(fixturePath)}`,
    );
    assert(
      defect.file.endsWith(".md"),
      `${label}.file must point to a Markdown fixture`,
    );

    const fixtureText = fs.existsSync(fixturePath)
      ? fs.readFileSync(fixturePath, "utf8")
      : "";
    assert(
      includesNormalized(fixtureText, defect.required_fix),
      `${label}.required_fix is not present in ${relative(fixturePath)}`,
    );
    assert(
      dddReviewRubric.includes(defect.rubric_evidence),
      `${label}.rubric_evidence is not present in methodologies/ddd/review-rubric.md`,
    );

    for (const field of [
      "severity",
      "lens",
      "dimension",
      "lesson_ref",
      "gate_ref",
    ]) {
      if (field !== "gate_ref") {
        assert(
          fixtureText.includes(String(defect.expected_suggestion[field])),
          `${label}.expected_suggestion.${field} is not reflected in ${relative(fixturePath)}`,
        );
      }
    }

    validateLessonRef(
      defect.expected_suggestion.lesson_ref,
      `${label}.expected_suggestion.lesson_ref`,
    );
    const rubricSnippet = validateRubricGateRef(
      defect.expected_suggestion.gate_ref,
      `${label}.expected_suggestion.gate_ref`,
    );
    const rubricSeverity = rubricSeverityForSnippet(rubricSnippet);
    assert(
      rubricSeverity === defect.expected_suggestion.severity,
      `${label}.expected_suggestion.severity must match ${defect.expected_suggestion.gate_ref} (${rubricSeverity || "unknown rubric severity"})`,
    );
  }
};

const validateAuthorSkillInputResolution = () => {
  assert(
    authorSkill.includes("## Step 2 - Resolve required inputs"),
    "author skill must include required input resolution step",
  );
  for (const marker of [
    "Input Sufficiency and Ownership Resolution",
    "required product inputs",
    "safe assumption",
    "ask the user",
    "Blocking Questions",
    "must not invent",
  ]) {
    assert(
      authorSkill.includes(marker),
      `author skill required input resolution must mention "${marker}"`,
    );
  }
};

const validateJsonSchemaFiles = () => {
  const schemasDir = path.join(packageRoot, "schemas");
  if (!fs.existsSync(schemasDir)) {
    return;
  }
  for (const schemaFile of sorted(
    fs
      .readdirSync(schemasDir)
      .filter((fileName) => fileName.endsWith(".schema.json")),
  )) {
    compileSchema(
      readJson(path.join("schemas", schemaFile)),
      `schemas/${schemaFile}`,
    );
  }
};

const validateCaseFixtures = () => {
  const casesDir = path.join(packageRoot, "fixtures/cases");
  if (!fs.existsSync(casesDir)) {
    return;
  }
  const expectedFactsShape = compileSchema(
    readJson("schemas/expected-facts.schema.json"),
    "expected facts",
  );
  const expectedBoundariesShape = compileSchema(
    readJson("schemas/expected-boundaries.schema.json"),
    "expected boundaries",
  );
  for (const caseId of sorted(
    fs
      .readdirSync(casesDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name),
  )) {
    for (const fileName of [
      "product.md",
      "source-map.md",
      "reference-design.md",
      "expected-facts.json",
      "expected-boundaries.json",
      "rubric.md",
      "grader-notes.md",
      "provenance.md",
    ]) {
      const fixturePath = path.join("fixtures/cases", caseId, fileName);
      assert(
        fs.existsSync(path.join(packageRoot, fixturePath)),
        `${fixturePath} is required`,
      );
    }

    const expectedFacts = readJson(
      path.join("fixtures/cases", caseId, "expected-facts.json"),
    );
    const expectedBoundaries = readJson(
      path.join("fixtures/cases", caseId, "expected-boundaries.json"),
    );
    if (expectedFactsShape) {
      recordAjvErrors(
        `fixtures/cases/${caseId}/expected-facts.json`,
        expectedFactsShape,
        expectedFacts,
      );
    }
    if (expectedBoundariesShape) {
      recordAjvErrors(
        `fixtures/cases/${caseId}/expected-boundaries.json`,
        expectedBoundariesShape,
        expectedBoundaries,
      );
    }
    assert(
      expectedFacts?.case_id === caseId,
      `fixtures/cases/${caseId}/expected-facts.json case_id must match ${caseId}`,
    );
    assert(
      expectedBoundaries?.case_id === caseId,
      `fixtures/cases/${caseId}/expected-boundaries.json case_id must match ${caseId}`,
    );
  }
};

const validateOutcomeTemplates = () => {
  const templatePath = "fixtures/outcomes/outcome-study-template.json";
  if (!fs.existsSync(path.join(packageRoot, templatePath))) {
    return;
  }
  const outcomeStudyShape = compileSchema(
    readJson("schemas/outcome-study.schema.json"),
    "outcome study",
  );
  if (outcomeStudyShape) {
    recordAjvErrors(templatePath, outcomeStudyShape, readJson(templatePath));
  }
};

validateExpectedSuggestions();
validateDefectManifest();
validateAuthorSkillInputResolution();
validateJsonSchemaFiles();
validateCaseFixtures();
validateOutcomeTemplates();

if (failures.length > 0) {
  console.error("Eval fixture validation failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Eval fixture validation passed.");
