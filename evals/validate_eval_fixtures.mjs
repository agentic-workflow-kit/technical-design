#!/usr/bin/env node
import Ajv2020 from "ajv/dist/2020.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const failures = [];
const ajv = new Ajv2020({ allErrors: true, strict: false });

const relative = (absolutePath) => path.relative(root, absolutePath);

const readText = (relativePath) => {
  const absolutePath = path.resolve(root, relativePath);
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
  const base = path.resolve(root, baseRelativePath);
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
  "evals/schemas/review-suggestion.schema.json",
);
const expectedSuggestionsSchema = readJson(
  "evals/schemas/expected-suggestions.schema.json",
);
const expectedDefectSuggestionSchema = readJson(
  "evals/schemas/expected-defect-suggestion.schema.json",
);
const defectManifestSchema = readJson(
  "evals/schemas/defect-manifest.schema.json",
);
const expectedSuggestions = readJson("evals/review/expected-suggestions.json");
const defectManifest = readJson("evals/ddd/defect-manifest.json");
const lessonsLedger = readText("docs/design/lessons-ledger.md");
const dddReviewRubric = readText("methodologies/ddd/review-rubric.md");

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
    const fixturePath = asPath("evals/ddd", defect.file);

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

const validateJsonSchemaFiles = () => {
  const schemasDir = path.join(root, "evals/schemas");
  if (!fs.existsSync(schemasDir)) {
    return;
  }
  for (const schemaFile of sorted(
    fs
      .readdirSync(schemasDir)
      .filter((fileName) => fileName.endsWith(".schema.json")),
  )) {
    compileSchema(
      readJson(path.join("evals/schemas", schemaFile)),
      `evals/schemas/${schemaFile}`,
    );
  }
};

const validateCaseFixtures = () => {
  const casesDir = path.join(root, "evals/cases");
  if (!fs.existsSync(casesDir)) {
    return;
  }
  const expectedFactsShape = compileSchema(
    readJson("evals/schemas/expected-facts.schema.json"),
    "expected facts",
  );
  const expectedBoundariesShape = compileSchema(
    readJson("evals/schemas/expected-boundaries.schema.json"),
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
      const fixturePath = path.join("evals/cases", caseId, fileName);
      assert(
        fs.existsSync(path.join(root, fixturePath)),
        `${fixturePath} is required`,
      );
    }

    const expectedFacts = readJson(
      path.join("evals/cases", caseId, "expected-facts.json"),
    );
    const expectedBoundaries = readJson(
      path.join("evals/cases", caseId, "expected-boundaries.json"),
    );
    if (expectedFactsShape) {
      recordAjvErrors(
        `evals/cases/${caseId}/expected-facts.json`,
        expectedFactsShape,
        expectedFacts,
      );
    }
    if (expectedBoundariesShape) {
      recordAjvErrors(
        `evals/cases/${caseId}/expected-boundaries.json`,
        expectedBoundariesShape,
        expectedBoundaries,
      );
    }
    assert(
      expectedFacts?.case_id === caseId,
      `evals/cases/${caseId}/expected-facts.json case_id must match ${caseId}`,
    );
    assert(
      expectedBoundaries?.case_id === caseId,
      `evals/cases/${caseId}/expected-boundaries.json case_id must match ${caseId}`,
    );
  }
};

const validateOutcomeTemplates = () => {
  const templatePath = "evals/outcomes/outcome-study-template.json";
  if (!fs.existsSync(path.join(root, templatePath))) {
    return;
  }
  const outcomeStudyShape = compileSchema(
    readJson("evals/schemas/outcome-study.schema.json"),
    "outcome study",
  );
  if (outcomeStudyShape) {
    recordAjvErrors(templatePath, outcomeStudyShape, readJson(templatePath));
  }
};

validateExpectedSuggestions();
validateDefectManifest();
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
