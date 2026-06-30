#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const failures = [];

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

const suggestionSchema = readJson(
  "skills/review-technical-design/templates/suggestion.schema.json",
);
const expectedSuggestions = readJson("evals/review/expected-suggestions.json");
const defectManifest = readJson("evals/ddd/defect-manifest.json");
const lessonsLedger = readText("docs/design/lessons-ledger.md");
const dddReviewRubric = readText("methodologies/ddd/review-rubric.md");

const lessonIds = extractLessonIds(lessonsLedger);

const validateSchemaObject = (schema, label) => {
  assert(
    schema && schema.type === "object",
    `${label} schema must be an object schema`,
  );
  assert(
    Array.isArray(schema?.required) && schema.required.length > 0,
    `${label} schema must declare required fields`,
  );
  assert(
    schema?.properties && typeof schema.properties === "object",
    `${label} schema must declare properties`,
  );
};

const validateStringField = (value, label) => {
  assert(typeof value === "string", `${label} must be a string`);
  if (typeof value === "string") {
    assert(
      value.trim().length > 0 || label.endsWith(".decision_ref"),
      `${label} must not be blank`,
    );
  }
};

const validateSchemaBackedField = (value, definition, label) => {
  if (!definition || typeof definition !== "object") {
    failures.push(`${label} has no schema definition`);
    return;
  }
  if (definition.type === "string") {
    validateStringField(value, label);
  }
  if (definition.enum) {
    assert(
      definition.enum.includes(value),
      `${label} must be one of ${definition.enum.join(", ")}`,
    );
  }
  if (definition.pattern && typeof value === "string") {
    assert(
      new RegExp(definition.pattern).test(value),
      `${label} does not match ${definition.pattern}`,
    );
  }
};

const validateLessonRef = (lessonRef, label) => {
  validateStringField(lessonRef, label);
  if (lessonRef !== "none") {
    assert(
      lessonIds.has(lessonRef),
      `${label} references unknown lesson ${lessonRef}`,
    );
  }
};

const validateRubricGateRef = (gateRef, label) => {
  validateStringField(gateRef, label);
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

const validateExpectedSuggestions = () => {
  validateSchemaObject(suggestionSchema, "review suggestion");

  assert(
    Array.isArray(expectedSuggestions) && expectedSuggestions.length > 0,
    "evals/review/expected-suggestions.json must contain a non-empty array",
  );
  if (!Array.isArray(expectedSuggestions)) {
    return;
  }
  if (!suggestionSchema?.properties) {
    return;
  }

  const ids = expectedSuggestions.map((suggestion) => suggestion.id);
  assert(uniqueValues(ids), "expected suggestion ids must be unique");

  const knownFields = new Set(Object.keys(suggestionSchema.properties));
  for (const [index, suggestion] of expectedSuggestions.entries()) {
    const label = `expected-suggestions[${index}]`;
    assert(
      suggestion &&
        typeof suggestion === "object" &&
        !Array.isArray(suggestion),
      `${label} must be an object`,
    );
    if (
      !suggestion ||
      typeof suggestion !== "object" ||
      Array.isArray(suggestion)
    ) {
      continue;
    }

    for (const field of suggestionSchema.required) {
      assert(Object.hasOwn(suggestion, field), `${label}.${field} is required`);
    }

    for (const field of Object.keys(suggestion)) {
      assert(
        knownFields.has(field),
        `${label}.${field} is not part of the suggestion schema`,
      );
      if (knownFields.has(field)) {
        validateSchemaBackedField(
          suggestion[field],
          suggestionSchema.properties[field],
          `${label}.${field}`,
        );
      }
    }

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
  const catchingSurfaces = new Set([
    "static-check",
    "review-rubric",
    "enforcement-seed",
    "future-judge-criterion",
  ]);
  const expectedSuggestionFields = [
    "severity",
    "lens",
    "dimension",
    "lesson_ref",
    "gate_ref",
  ];

  assert(
    defectManifest &&
      typeof defectManifest === "object" &&
      !Array.isArray(defectManifest),
    "evals/ddd/defect-manifest.json must be an object",
  );
  if (
    !defectManifest ||
    typeof defectManifest !== "object" ||
    Array.isArray(defectManifest)
  ) {
    return;
  }

  validateStringField(defectManifest.version, "defect-manifest.version");
  assert(
    Array.isArray(defectManifest.defects) && defectManifest.defects.length > 0,
    "defect-manifest.defects must be a non-empty array",
  );
  if (!Array.isArray(defectManifest.defects)) {
    return;
  }

  const ids = defectManifest.defects.map((defect) => defect.id);
  assert(uniqueValues(ids), "defect manifest ids must be unique");
  for (const defectId of initialDefectIds) {
    assert(ids.includes(defectId), `defect manifest must include ${defectId}`);
  }

  for (const [index, defect] of defectManifest.defects.entries()) {
    const label = `defect-manifest.defects[${index}]`;
    assert(
      defect && typeof defect === "object" && !Array.isArray(defect),
      `${label} must be an object`,
    );
    if (!defect || typeof defect !== "object" || Array.isArray(defect)) {
      continue;
    }

    for (const field of [
      "id",
      "file",
      "required_class",
      "catching_surface",
      "rubric_evidence",
      "required_fix",
    ]) {
      validateStringField(defect[field], `${label}.${field}`);
    }
    if (
      ![
        "id",
        "file",
        "required_class",
        "catching_surface",
        "rubric_evidence",
        "required_fix",
      ].every((field) => typeof defect[field] === "string")
    ) {
      continue;
    }
    assert(
      catchingSurfaces.has(defect.catching_surface),
      `${label}.catching_surface must be one of ${[...catchingSurfaces].join(", ")}`,
    );

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

    assert(
      defect.expected_suggestion &&
        typeof defect.expected_suggestion === "object" &&
        !Array.isArray(defect.expected_suggestion),
      `${label}.expected_suggestion must be an object`,
    );
    if (
      !defect.expected_suggestion ||
      typeof defect.expected_suggestion !== "object" ||
      Array.isArray(defect.expected_suggestion)
    ) {
      continue;
    }

    for (const field of expectedSuggestionFields) {
      assert(
        Object.hasOwn(defect.expected_suggestion, field),
        `${label}.expected_suggestion.${field} is required`,
      );
      const schemaField = suggestionSchema.properties[field];
      validateSchemaBackedField(
        defect.expected_suggestion[field],
        schemaField,
        `${label}.expected_suggestion.${field}`,
      );
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

validateExpectedSuggestions();
validateDefectManifest();

if (failures.length > 0) {
  console.error("Eval fixture validation failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Eval fixture validation passed.");
