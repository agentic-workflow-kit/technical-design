import fs from "node:fs";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";

import {
  aggregateVerdict,
  criticalBlockerCount as countPolicyBlockers,
  assessCoverage,
  gradeFacts,
} from "@agentic-workflow-kit/eval-kit";

// Helper functions for static validations
const normalizeWhitespace = (value) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

const includesNormalized = (text, expected) =>
  normalizeWhitespace(text).includes(normalizeWhitespace(expected));

const extractSourceRefs = (text) =>
  new Set(
    [...String(text ?? "").matchAll(/\bSRC-[0-9]{3}\b/g)].map(
      (match) => match[0],
    ),
  );

const allowedCaseTypes = new Set([
  "tiny_contract",
  "ddd_heavy",
  "negative_fit_low_ceremony",
  "integration_api_seam",
  "state_machine_lifecycle",
  "control_plane_runtime",
]);

const requiredCasePurposeFields = [
  "case_type",
  "primary_capability",
  "secondary_capability",
  "what_this_case_must_not_test",
  "required_deterministic_blockers",
  "acceptable_design_alternatives",
  "bad_candidate_snippets",
  "future_adjustment_notes",
];

const extractLessonIds = (ledgerText) =>
  new Set(
    [...ledgerText.matchAll(/\|\s+(LSN-\d{3})\s+\|/g)].map((match) => match[1]),
  );

const extractVersion = (promptText, label) => {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = [
    ...promptText.matchAll(
      new RegExp(`${escapedLabel}:\\s*\\\`([^\\\`]+)\\\``, "g"),
    ),
  ];
  const match = matches.find((candidate) => !candidate[1].includes("{{"));
  if (!match) {
    throw new Error(`Could not find ${label} in prompt`);
  }
  return match[1];
};

// Variable resolvers for Promptfoo

export const resolveGenerationVars = async ({
  caseId,
  caseDir,
  artifacts,
  resolver,
}) => {
  const readText = (relPath) =>
    fs.readFileSync(path.resolve(resolver.repoRoot, relPath), "utf8");

  return {
    product_md: readText(
      path.join(resolver.relativeToRepo(caseDir), "product.md"),
    ),
    source_map_md: readText(
      path.join(resolver.relativeToRepo(caseDir), "source-map.md"),
    ),
    author_skill_md: readText("skills/author-technical-design/SKILL.md"),
    technical_design_template_md: readText(
      "methodologies/ddd/templates/technical-design.md",
    ),
    bounded_context_template_md: readText(
      "methodologies/ddd/templates/bounded-context.md",
    ),
    enforcement_map_template_md: readText(
      "methodologies/ddd/templates/enforcement-map.md",
    ),
    ddd_eval_expectations_md: readText(
      "methodologies/ddd/eval-expectations.md",
    ),
  };
};

export const resolvePointwiseVars = async ({
  caseId,
  caseDir,
  artifacts,
  candidateContent,
  candidatePath,
  promptVersion,
  rubricVersion,
  model,
  provider,
  resolver,
}) => {
  const readText = (relPath) =>
    fs.readFileSync(path.resolve(resolver.repoRoot, relPath), "utf8");
  const readJson = (relPath) => JSON.parse(readText(relPath));

  const expectedFacts = readJson(
    path.join(resolver.relativeToRepo(caseDir), "expected-facts.json"),
  );
  const expectedBoundaries = readJson(
    path.join(resolver.relativeToRepo(caseDir), "expected-boundaries.json"),
  );

  const expectedItems = [
    ...expectedFacts.facts.map((fact) => ({
      item_id: fact.id,
      kind: "fact",
      severity: fact.severity,
      source_refs: fact.source_refs,
      description: fact.description,
      must_include_any: fact.must_include_any,
      must_include_all: fact.must_include_all ?? [],
      must_not_include_any: fact.must_not_include_any ?? [],
      accepted_alternatives: fact.accepted_alternatives ?? [],
      required_concepts: fact.required_concepts ?? [],
    })),
    ...expectedBoundaries.contexts.map((context) => ({
      item_id: context.id,
      kind: "boundary",
      severity: "critical",
      source_refs: context.source_refs,
      description: [
        `Context ${context.name} owns ${context.owns.join(", ")}.`,
        context.reads.length > 0
          ? `It reads ${context.reads.join(", ")}.`
          : "It does not require external reads.",
        context.does_not_own.length > 0
          ? `It must not own ${context.does_not_own.join(", ")}.`
          : "No prohibited ownership items were declared.",
      ].join(" "),
      must_include_any: context.must_include_any ?? [],
      must_include_all: [
        context.name,
        ...context.owns,
        ...(context.must_include_all ?? []),
      ],
      must_not_include_any: context.must_not_include_any ?? [],
      accepted_alternatives: context.accepted_alternatives ?? [],
      required_concepts: context.required_concepts ?? [],
    })),
  ];

  return {
    case_id: caseId,
    model,
    provider,
    prompt_version: promptVersion,
    rubric_version: rubricVersion,
    source_facts: [
      "# Product Brief",
      "",
      readText(path.join(resolver.relativeToRepo(caseDir), "product.md")),
      "",
      "# Source Map",
      "",
      readText(path.join(resolver.relativeToRepo(caseDir), "source-map.md")),
    ].join("\n"),
    expected_items: JSON.stringify(expectedItems, null, 2),
    candidate_path: resolver.relativeToRepo(candidatePath),
    candidate: candidateContent,
    _expectedItemsForCanonicalization: expectedItems, // Passed along to post-processing
  };
};

export const canonicalizeExpectedItemMetadata = (
  actualItems,
  expectedItems,
) => {
  const actualById = new Map(actualItems.map((item) => [item.item_id, item]));
  const actualIds = actualItems.map((item) => item.item_id).sort();
  const expectedIds = expectedItems.map((item) => item.item_id).sort();
  if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) {
    throw new Error(
      `pointwise result item_ids mismatch: expected ${JSON.stringify(expectedIds)}, received ${JSON.stringify(actualIds)}`,
    );
  }

  return expectedItems.map((expected) => ({
    ...actualById.get(expected.item_id),
    kind: expected.kind,
    severity: expected.severity,
    source_refs: expected.source_refs,
  }));
};

export const resolvePairwiseVars = async ({
  caseId,
  caseDir,
  artifacts,
  candidateAContent,
  candidateBContent,
  candidateAPath,
  candidateBPath,
  promptVersion,
  rubricVersion,
  model,
  provider,
  randomizedOrder,
  resolver,
}) => {
  const readText = (relPath) =>
    fs.readFileSync(path.resolve(resolver.repoRoot, relPath), "utf8");

  const [firstKey, secondKey] = randomizedOrder.candidate_order;
  const candidate_a =
    firstKey === "candidate_a" ? candidateAContent : candidateBContent;
  const candidate_b =
    firstKey === "candidate_a" ? candidateBContent : candidateAContent;
  const candidate_a_path =
    firstKey === "candidate_a" ? candidateAPath : candidateBPath;
  const candidate_b_path =
    firstKey === "candidate_a" ? candidateBPath : candidateAPath;

  return {
    case_id: caseId,
    model,
    provider,
    prompt_version: promptVersion,
    rubric_version: rubricVersion,
    source_facts: [
      "# Product Brief",
      "",
      readText(path.join(resolver.relativeToRepo(caseDir), "product.md")),
      "",
      "# Source Map",
      "",
      readText(path.join(resolver.relativeToRepo(caseDir), "source-map.md")),
    ].join("\n"),
    candidate_a_path: resolver.relativeToRepo(candidate_a_path),
    candidate_b_path: resolver.relativeToRepo(candidate_b_path),
    candidate_a,
    candidate_b,
    randomization_seed: randomizedOrder.seed,
    randomization_order: randomizedOrder.candidate_order.join(", "),
  };
};

// Compile Report (combines deterministic, pointwise, pairwise etc.)

export const compileReport = async ({
  config,
  runId,
  runs,
  resultDir,
  resolver,
}) => {
  const reportParts = [`# Manual Combined Report: ${runId}`, ""];
  const caseIds = [];
  const artifacts = [];
  const outputFiles = [];

  const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
  const readText = (p) => fs.readFileSync(p, "utf8");

  // Read files and compile MD
  if (runs.deterministic) {
    const detDir = resolver.resolveRunDir(runs.deterministic);
    const grades = readJson(path.join(detDir, "grades.json"));
    caseIds.push(grades.case_id);
    const rep = readText(path.join(detDir, "report.md"));
    reportParts.push("## Deterministic Run results", "", rep, "");

    const gradesPath = `deterministic_grades.json`;
    fs.writeFileSync(
      path.join(resultDir, gradesPath),
      JSON.stringify(grades, null, 2) + "\n",
    );
    artifacts.push({
      role: "deterministic_grades",
      path: gradesPath,
      mediaType: "application/json",
    });
    outputFiles.push(gradesPath);
  }

  if (runs.generate) {
    const genDir = resolver.resolveRunDir(runs.generate);
    const rep = readText(path.join(genDir, "report.md"));
    reportParts.push("## Candidate Generation", "", rep, "");
  }

  if (runs["judge-coverage"]) {
    const ptDir = resolver.resolveRunDir(runs["judge-coverage"]);
    const ptResult = readJson(path.join(ptDir, "pointwise-result.json"));
    const rep = readText(path.join(ptDir, "report.md"));
    reportParts.push("## Pointwise Coverage Judge", "", rep, "");

    const pointwisePath = `pointwise-result.json`;
    fs.writeFileSync(
      path.join(resultDir, pointwisePath),
      JSON.stringify(ptResult, null, 2) + "\n",
    );
    artifacts.push({
      role: "pointwise_judge_result",
      path: pointwisePath,
      mediaType: "application/json",
    });
    outputFiles.push(pointwisePath);
  }

  if (runs.judge) {
    const pwDir = resolver.resolveRunDir(runs.judge);
    const pwResult = readJson(path.join(pwDir, "pairwise-result.json"));
    const rep = readText(path.join(pwDir, "report.md"));
    reportParts.push("## Pairwise Evaluation Judge", "", rep, "");

    const pairwisePath = `pairwise-result.json`;
    fs.writeFileSync(
      path.join(resultDir, pairwisePath),
      JSON.stringify(pwResult, null, 2) + "\n",
    );
    artifacts.push({
      role: "pairwise_judge_result",
      path: pairwisePath,
      mediaType: "application/json",
    });
    outputFiles.push(pairwisePath);
  }

  return {
    reportContent: reportParts.join("\n"),
    caseIds: [...new Set(caseIds)],
    artifacts,
    outputFiles,
  };
};

// Custom domain validations for technical-design fixtures

export const validateFixtures = async ({ config, manifests }) => {
  const failures = [];
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const repoRoot = config.pathResolver.repoRoot;

  const readText = (relPath) => {
    try {
      return fs.readFileSync(path.resolve(repoRoot, relPath), "utf8");
    } catch (error) {
      failures.push(`failed to read ${relPath}: ${error.message}`);
      return "";
    }
  };

  const readJson = (relPath) => {
    try {
      return JSON.parse(readText(relPath));
    } catch (error) {
      failures.push(`failed to parse ${relPath}: ${error.message}`);
      return null;
    }
  };

  const assert = (condition, message) => {
    if (!condition) failures.push(message);
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

  const validateNoReferenceAnchorLabels = (value, label) => {
    if (Array.isArray(value)) {
      for (const [index, item] of value.entries()) {
        validateNoReferenceAnchorLabels(item, `${label}[${index}]`);
      }
      return;
    }
    if (!value || typeof value !== "object") {
      return;
    }
    if (
      typeof value.label === "string" &&
      /\breference(?:\s+anchor|\s+design)?\b/i.test(value.label)
    ) {
      failures.push(`${label}.label must not cite reference-anchor wording`);
    }
    for (const [key, item] of Object.entries(value)) {
      if (key !== "label") {
        validateNoReferenceAnchorLabels(item, `${label}.${key}`);
      }
    }
  };

  const lessonsLedger = readText("docs/design/lessons-ledger.md");
  const dddReviewRubric = readText("methodologies/ddd/review-rubric.md");
  const authorSkill = readText("skills/author-technical-design/SKILL.md");
  const lessonIds = extractLessonIds(lessonsLedger);

  const validateLessonRef = (lessonRef, label) => {
    if (typeof lessonRef !== "string") {
      failures.push(`${label} must be a string`);
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
    if (typeof gateRef !== "string") {
      failures.push(`${label} must be a string`);
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

  // Load and register all local schemas first so refs can be resolved
  const schemasDir = path.resolve(repoRoot, "evals/schemas");
  if (fs.existsSync(schemasDir)) {
    const files = fs
      .readdirSync(schemasDir)
      .filter((f) => f.endsWith(".schema.json"))
      .sort();
    for (const file of files) {
      const schema = JSON.parse(
        fs.readFileSync(path.join(schemasDir, file), "utf8"),
      );
      if (schema.$id && !ajv.getSchema(schema.$id)) {
        ajv.addSchema(schema);
      }
    }
  }

  // Compile local schemas on registry
  const compileLocalSchema = (schemaPath, label) => {
    const schema = readJson(schemaPath);
    if (!schema) return null;
    if (schema.$id) {
      return ajv.getSchema(schema.$id) || ajv.compile(schema);
    }
    return ajv.compile(schema);
  };

  const expectedSuggestionsSchema = compileLocalSchema(
    "evals/schemas/expected-suggestions.schema.json",
    "expected suggestions",
  );
  const expectedDefectSuggestionSchema = compileLocalSchema(
    "evals/schemas/expected-defect-suggestion.schema.json",
    "expected defect suggestion",
  );
  const reviewSuggestionSchema = compileLocalSchema(
    "evals/schemas/review-suggestion.schema.json",
    "review suggestion",
  );
  const defectManifestSchema = compileLocalSchema(
    "evals/schemas/defect-manifest.schema.json",
    "defect manifest",
  );

  // Validate expected suggestions
  const expectedSuggestions = readJson(
    "evals/fixtures/review/expected-suggestions.json",
  );
  if (expectedSuggestions && expectedSuggestionsSchema) {
    const valid = expectedSuggestionsSchema(expectedSuggestions);
    if (!valid && expectedSuggestionsSchema.errors) {
      for (const err of expectedSuggestionsSchema.errors) {
        failures.push(
          `expected-suggestions.${err.instancePath || "<root>"} ${err.message}`,
        );
      }
    } else {
      const ids = expectedSuggestions.map((suggestion) => suggestion.id);
      assert(
        new Set(ids).size === ids.length,
        "expected suggestion ids must be unique",
      );

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
    }
  }

  // Validate defect manifest
  const defectManifest = readJson("evals/fixtures/ddd/defect-manifest.json");
  if (defectManifest && defectManifestSchema) {
    const valid = defectManifestSchema(defectManifest);
    if (!valid && defectManifestSchema.errors) {
      for (const err of defectManifestSchema.errors) {
        failures.push(
          `defect-manifest.${err.instancePath || "<root>"} ${err.message}`,
        );
      }
    } else {
      validateNoBlankStrings(defectManifest, "defect-manifest");
      const ids = defectManifest.defects.map((defect) => defect.id);
      assert(
        new Set(ids).size === ids.length,
        "defect manifest ids must be unique",
      );

      const initialDefectIds = [
        "invented-failure-token",
        "missing-context-ownership",
        "unresolved-required-input",
        "public-api-exposure-gap",
        "unsourced-invariant-operand",
        "vacuous-enforcement",
      ];
      for (const defectId of initialDefectIds) {
        assert(
          ids.includes(defectId),
          `defect manifest must include ${defectId}`,
        );
      }

      for (const [index, defect] of defectManifest.defects.entries()) {
        const label = `defect-manifest.defects[${index}]`;
        const base = path.resolve(repoRoot, "evals/fixtures/ddd");
        const fixturePath = path.resolve(base, defect.file);
        assert(
          fixturePath === base || fixturePath.startsWith(`${base}${path.sep}`),
          `${defect.file} escapes fixtures/ddd`,
        );

        assert(
          fs.existsSync(fixturePath),
          `${label}.file does not exist: ${defect.file}`,
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
          `${label}.required_fix is not present in ${defect.file}`,
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
              `${label}.expected_suggestion.${field} is not reflected in ${defect.file}`,
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
    }
  }

  // Validate author skill
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
    "source-named aggregate",
    "service candidate",
    "internal sub-boundary",
  ]) {
    assert(
      authorSkill.includes(marker),
      `author skill required input resolution must mention "${marker}"`,
    );
  }

  // Validate case purpose and expected files in case manifests
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

  const expectedFactsShape = compileLocalSchema(
    "packages/eval-kit/schemas/expected-facts.schema.json",
    "expected facts",
  );
  const expectedBoundariesShape = compileLocalSchema(
    "packages/eval-kit/schemas/expected-boundaries.schema.json",
    "expected boundaries",
  );

  for (const item of manifests) {
    const caseId = item.manifest.case_id;
    const caseDir = path.dirname(item.fullPath);

    // Assert that all required legacy files exist under the case directory
    for (const fileName of requiredLegacyArtifacts) {
      assert(
        fs.existsSync(path.join(caseDir, fileName)),
        `case ${caseId} missing expected file ${fileName}`,
      );
    }

    const expectedFacts = readJson(path.join(caseDir, "expected-facts.json"));
    const expectedBoundaries = readJson(
      path.join(caseDir, "expected-boundaries.json"),
    );
    const graderNotes = readText(path.join(caseDir, "grader-notes.md"));

    // Case purpose validation
    const section =
      graderNotes.match(
        /(^|\n)## Case Purpose\n(?<body>[\s\S]*?)(?=\n## |\n# |$)/,
      )?.groups?.body ?? "";
    assert(
      section.length > 0,
      `fixtures/cases/${caseId}/grader-notes.md must include a ## Case Purpose section`,
    );

    if (section) {
      const values = new Map(
        [...section.matchAll(/^([a-z_]+):\s*(.*)$/gm)].map((m) => [
          m[1],
          m[2].trim(),
        ]),
      );
      for (const field of requiredCasePurposeFields) {
        assert(
          values.has(field),
          `fixtures/cases/${caseId}/grader-notes.md Case Purpose must include ${field}:`,
        );
        assert(
          values.get(field)?.length > 0,
          `fixtures/cases/${caseId}/grader-notes.md Case Purpose ${field} must not be blank`,
        );
      }
      const caseType = values.get("case_type");
      assert(
        allowedCaseTypes.has(caseType),
        `fixtures/cases/${caseId}/grader-notes.md Case Purpose case_type must be one of [${Array.from(allowedCaseTypes).join(", ")}]`,
      );
    }

    // Verify expected json schemas
    if (expectedFacts && expectedFactsShape) {
      const valid = expectedFactsShape(expectedFacts);
      if (!valid && expectedFactsShape.errors) {
        for (const err of expectedFactsShape.errors) {
          failures.push(
            `case ${caseId} expected-facts.${err.instancePath} ${err.message}`,
          );
        }
      }
    }
    if (expectedBoundaries && expectedBoundariesShape) {
      const valid = expectedBoundariesShape(expectedBoundaries);
      if (!valid && expectedBoundariesShape.errors) {
        for (const err of expectedBoundariesShape.errors) {
          failures.push(
            `case ${caseId} expected-boundaries.${err.instancePath} ${err.message}`,
          );
        }
      }
    }

    assert(
      expectedFacts?.case_id === caseId,
      `case ${caseId} expected-facts.json case_id mismatch`,
    );
    assert(
      expectedBoundaries?.case_id === caseId,
      `case ${caseId} expected-boundaries.json case_id mismatch`,
    );

    const productText = readText(path.join(caseDir, "product.md"));
    const sourceMapText = readText(path.join(caseDir, "source-map.md"));
    const visibleSourceRefs = new Set([
      ...extractSourceRefs(productText),
      ...extractSourceRefs(sourceMapText),
    ]);

    for (const [index, fact] of (expectedFacts?.facts ?? []).entries()) {
      validateNoReferenceAnchorLabels(
        fact.accepted_alternatives ?? [],
        `expected-facts.json facts[${index}].accepted_alternatives`,
      );
      validateNoReferenceAnchorLabels(
        fact.required_concepts ?? [],
        `expected-facts.json facts[${index}].required_concepts`,
      );
      for (const ref of fact.source_refs ?? []) {
        assert(
          visibleSourceRefs.has(ref),
          `expected-facts.json facts[${index}].source_refs includes ${ref}, which is not present in product.md or source-map.md`,
        );
      }
    }

    for (const [index, context] of (
      expectedBoundaries?.contexts ?? []
    ).entries()) {
      validateNoReferenceAnchorLabels(
        context.accepted_alternatives ?? [],
        `expected-boundaries.json contexts[${index}].accepted_alternatives`,
      );
      validateNoReferenceAnchorLabels(
        context.required_concepts ?? [],
        `expected-boundaries.json contexts[${index}].required_concepts`,
      );
      for (const ref of context.source_refs ?? []) {
        assert(
          visibleSourceRefs.has(ref),
          `expected-boundaries.json contexts[${index}].source_refs includes ${ref}, which is not present in product.md or source-map.md`,
        );
      }
    }
  }

  // Validate outcomes templates
  const templatePath = "evals/fixtures/outcomes/outcome-study-template.json";
  const outcomeStudyShape = compileLocalSchema(
    "evals/schemas/outcome-study.schema.json",
    "outcome study",
  );
  if (
    fs.existsSync(path.resolve(repoRoot, templatePath)) &&
    outcomeStudyShape
  ) {
    const valid = outcomeStudyShape(readJson(templatePath));
    if (!valid && outcomeStudyShape.errors) {
      for (const err of outcomeStudyShape.errors) {
        failures.push(`outcome-template.${err.instancePath} ${err.message}`);
      }
    }
  }

  if (failures.length > 0) {
    throw new Error(
      `Domain validation failed:\n${failures.map((f) => `- ${f}`).join("\n")}`,
    );
  }
};

export const deterministicVerdictPolicy = {
  blocking_severities: ["critical"],
  blocking_verdicts: ["missing", "contradicted", "invented"],
  non_green_verdicts: ["missing", "contradicted", "invented", "unknown"],
  red_verdict: "red",
  yellow_verdict: "yellow",
  green_verdict: "green",
};

export const gradeBoundaries = (candidateText, expectedBoundaries) =>
  expectedBoundaries.contexts.map((context) => {
    const assessment = assessCoverage(candidateText, context, {
      defaultMustIncludeAll: [context.name, ...context.owns],
      requireCoLocatedAll: true,
    });
    return {
      id: context.id,
      kind: "boundary",
      severity: "critical",
      verdict: assessment.verdict,
      evidence: assessment.evidence,
    };
  });

export const gradeTechnicalDesignCandidate = ({
  candidateText,
  expectedFacts,
  expectedBoundaries,
}) => {
  const findings = [
    ...gradeFacts(candidateText, expectedFacts),
    ...gradeBoundaries(candidateText, expectedBoundaries),
  ];
  return {
    findings,
    verdict: aggregateVerdict(findings, deterministicVerdictPolicy),
  };
};

export const criticalBlockerCount = (findings) =>
  countPolicyBlockers(findings, deterministicVerdictPolicy);

export const verdictForFindings = (findings) =>
  aggregateVerdict(findings, deterministicVerdictPolicy);

export const renderDeterministicReport = ({
  caseId,
  grades,
  findings,
  caseDir,
  candidatePath,
  resolver,
}) => {
  const blockerCount = criticalBlockerCount(findings);
  const findingCounts = findings.reduce(
    (counts, finding) => ({
      ...counts,
      [finding.verdict]: (counts[finding.verdict] ?? 0) + 1,
    }),
    {},
  );
  const relCaseDir = resolver ? resolver.relativeToRepo(caseDir) : caseDir;
  const relCandidatePath = resolver
    ? resolver.relativeToRepo(candidatePath)
    : candidatePath;

  return [
    `# Eval Report: ${caseId}`,
    "",
    `Verdict: ${grades.verdict}`,
    `Blocker findings: ${blockerCount}`,
    `Finding counts: covered=${findingCounts.covered ?? 0}, missing=${findingCounts.missing ?? 0}, contradicted=${findingCounts.contradicted ?? 0}, invented=${findingCounts.invented ?? 0}, unknown=${findingCounts.unknown ?? 0}`,
    "",
    "## Findings",
    "",
    ...findings.map(
      (finding) =>
        `- ${finding.id} (${finding.kind}, ${finding.severity}): ${finding.verdict} - ${finding.evidence}`,
    ),
    "",
    `Case directory: ${relCaseDir}`,
    `Candidate: ${relCandidatePath}`,
  ].join("\n");
};
