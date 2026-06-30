#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

import { defaultRunId, parseArgs, requireArg } from "./lib/args.mjs";
import {
  readJson,
  readText,
  validateJsonWithSchema,
  writeJson,
  writeText,
} from "./lib/json.mjs";
import {
  codexAuthMode,
  commandString,
  gitCommit,
  toolVersions,
} from "./lib/metadata.mjs";
import {
  codexProviderId,
  extractPromptfooOutput,
  normalizeCodexProvider,
  parseJsonOutput,
  runPromptfoo,
} from "./lib/promptfoo.mjs";
import {
  relativeToPackage,
  relativeToRepo,
  resolveCaseDir,
  resolveRepoInputPath,
  resolveRepoPath,
  resolveRunDir,
} from "./lib/paths.mjs";

const promptfooOutputFiles = (runDir) => ({
  config: path.join(runDir, "promptfooconfig.json"),
  json: path.join(runDir, "promptfoo-results.json"),
  html: path.join(runDir, "promptfoo-report.html"),
});

const providerSafeOutputSchema = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => providerSafeOutputSchema(item));
  }
  if (!value || typeof value !== "object") {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== "allOf")
      .map(([key, item]) => [key, providerSafeOutputSchema(item)]),
  );
};

const extractVersion = (promptText, label) => {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = [
    ...promptText.matchAll(
      new RegExp(`${escapedLabel}:\\s*\\\`([^\\\`]+)\\\``, "g"),
    ),
  ];
  const match = matches.find((candidate) => !candidate[1].includes("{{"));
  if (!match) {
    throw new Error(`Could not find ${label} in pointwise prompt`);
  }
  return match[1];
};

const loadExpectedItems = (caseDir) => {
  const expectedFacts = validateJsonWithSchema(
    "expected-facts.schema.json",
    readJson(path.join(caseDir, "expected-facts.json")),
    "expected facts",
  );
  const expectedBoundaries = validateJsonWithSchema(
    "expected-boundaries.schema.json",
    readJson(path.join(caseDir, "expected-boundaries.json")),
    "expected boundaries",
  );

  return [
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
};

const judgeVars = ({
  caseId,
  caseDir,
  model,
  provider,
  promptVersion,
  rubricVersion,
  candidatePath,
  candidateContent,
  expectedItems,
}) => ({
  case_id: caseId,
  model,
  provider,
  prompt_version: promptVersion,
  rubric_version: rubricVersion,
  source_facts: [
    "# Product Brief",
    "",
    readText(path.join(caseDir, "product.md")),
    "",
    "# Source Map",
    "",
    readText(path.join(caseDir, "source-map.md")),
  ].join("\n"),
  expected_items: JSON.stringify(expectedItems, null, 2),
  candidate_path: relativeToRepo(candidatePath),
  candidate: candidateContent,
});

const buildPromptfooConfig = ({
  model,
  provider,
  effort,
  runDir,
  promptPath,
  vars,
  outputSchema,
  caseId,
}) => {
  const outputFiles = promptfooOutputFiles(runDir);
  return {
    description: `technical-design pointwise judge eval for ${caseId}`,
    prompts: [promptPath],
    providers: [
      {
        id: codexProviderId({ provider, model }),
        config: {
          sandbox_mode: "read-only",
          approval_policy: "never",
          model_reasoning_effort: effort,
          output_schema: outputSchema,
        },
      },
    ],
    tests: [
      {
        vars,
      },
    ],
    outputPath: [outputFiles.json, outputFiles.html],
  };
};

const canonicalizeExpectedItemMetadata = (actualItems, expectedItems) => {
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

const summarizeVerdicts = (items) => {
  const counts = {
    covered: 0,
    partial: 0,
    missing: 0,
    contradicted: 0,
    unknown: 0,
  };
  for (const item of items) {
    counts[item.verdict] += 1;
  }
  return counts;
};

const main = () => {
  const args = parseArgs(process.argv.slice(2));
  const caseId = requireArg(args, "case");
  const candidatePath = resolveRepoInputPath(
    requireArg(args, "candidate"),
    "candidate path",
  );
  const model = requireArg(args, "model");
  const providerArg = requireArg(args, "provider");
  const effort = requireArg(args, "effort");
  const runId = args["run-id"] ?? defaultRunId("judge-coverage");

  const authMode = codexAuthMode();
  const provider = normalizeCodexProvider(providerArg);
  const caseDir = resolveCaseDir(caseId);
  const runDir = resolveRunDir(runId);
  const promptPath = resolveRepoPath(
    "packages/evals/promptfoo/judges/pointwise.prompt.md",
  );
  const promptText = readText(promptPath);
  const outputSchema = readJson(
    resolveRepoPath(
      "packages/evals/schemas/pointwise-judge-result.schema.json",
    ),
  );
  const promptVersion = extractVersion(promptText, "Prompt version");
  const rubricVersion = extractVersion(promptText, "Rubric version");
  const expectedItems = loadExpectedItems(caseDir);
  const vars = judgeVars({
    caseId,
    caseDir,
    model,
    provider,
    promptVersion,
    rubricVersion,
    candidatePath,
    candidateContent: readText(candidatePath),
    expectedItems,
  });
  const outputFiles = promptfooOutputFiles(runDir);

  fs.mkdirSync(runDir, { recursive: true });

  const config = buildPromptfooConfig({
    model,
    provider,
    effort,
    runDir,
    promptPath,
    vars,
    outputSchema: providerSafeOutputSchema(outputSchema),
    caseId,
  });
  writeJson(outputFiles.config, config);

  runPromptfoo(outputFiles.config);

  const promptfooResults = readJson(outputFiles.json);
  const rawResult = parseJsonOutput(extractPromptfooOutput(promptfooResults));
  const result = validateJsonWithSchema(
    "pointwise-judge-result.schema.json",
    rawResult,
    "pointwise judge result",
  );

  if (result.case_id !== caseId) {
    throw new Error(
      `pointwise result case_id mismatch: expected ${caseId}, received ${result.case_id}`,
    );
  }
  if (result.model !== model) {
    throw new Error(
      `pointwise result model mismatch: expected ${model}, received ${result.model}`,
    );
  }
  if (result.provider !== provider) {
    throw new Error(
      `pointwise result provider mismatch: expected ${provider}, received ${result.provider}`,
    );
  }
  if (result.prompt_version !== promptVersion) {
    throw new Error(
      `pointwise result prompt_version mismatch: expected ${promptVersion}, received ${result.prompt_version}`,
    );
  }
  if (result.rubric_version !== rubricVersion) {
    throw new Error(
      `pointwise result rubric_version mismatch: expected ${rubricVersion}, received ${result.rubric_version}`,
    );
  }
  const canonicalResult = {
    ...result,
    items: canonicalizeExpectedItemMetadata(result.items, expectedItems),
  };

  writeJson(path.join(runDir, "pointwise-result.json"), canonicalResult);

  const counts = summarizeVerdicts(canonicalResult.items);
  const manifest = validateJsonWithSchema(
    "results-manifest.schema.json",
    {
      run_id: runId,
      git_commit: gitCommit(),
      command: commandString(),
      case_ids: [caseId],
      tool_versions: toolVersions(),
      run_type: "judge-coverage",
      model_provider: codexProviderId({ provider, model }),
      model,
      provider,
      reasoning_effort: effort,
      sandbox_mode: "read-only",
      approval_policy: "never",
      codex_auth_mode: authMode,
      prompt_version: promptVersion,
      rubric_version: rubricVersion,
      output_files: [
        "manifest.json",
        "report.md",
        "pointwise-result.json",
        "promptfooconfig.json",
        "promptfoo-results.json",
        "promptfoo-report.html",
      ],
    },
    "manifest",
  );
  writeJson(path.join(runDir, "manifest.json"), manifest);

  writeText(
    path.join(runDir, "report.md"),
    [
      `# Pointwise Judge Report: ${caseId}`,
      "",
      `Model: ${model}`,
      `Provider: ${provider}`,
      `Auth mode: ${authMode}`,
      `Prompt version: ${promptVersion}`,
      `Rubric version: ${rubricVersion}`,
      `Candidate: ${relativeToRepo(candidatePath)}`,
      "",
      "## Coverage Summary",
      "",
      `- covered: ${counts.covered}`,
      `- partial: ${counts.partial}`,
      `- missing: ${counts.missing}`,
      `- contradicted: ${counts.contradicted}`,
      `- unknown: ${counts.unknown}`,
      "",
      "## Item Results",
      "",
      ...canonicalResult.items.map(
        (item) =>
          `- ${item.item_id} (${item.kind}, ${item.severity}): ${item.verdict} [${item.confidence}]${item.candidate_evidence.length > 0 ? ` evidence=${item.candidate_evidence.join(" | ")}` : ""} explanation=${item.explanation}`,
      ),
    ].join("\n"),
  );

  console.log(
    `Wrote pointwise judge eval results to ${relativeToPackage(runDir)}`,
  );
};

main();
