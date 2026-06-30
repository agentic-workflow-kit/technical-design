#!/usr/bin/env node
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { parseArgs, requireArg } from "./lib/args.mjs";
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

const RANDOMIZATION_METHOD = "sha256-seed-parity-v1";

const promptfooOutputFiles = (runDir) => ({
  config: path.join(runDir, "promptfooconfig.json"),
  json: path.join(runDir, "promptfoo-results.json"),
  html: path.join(runDir, "promptfoo-report.html"),
});

const randomizeCandidateOrder = ({
  seed,
  caseId,
  candidateAPath,
  candidateBPath,
}) => {
  const originalOrder = ["candidate_a", "candidate_b"];
  const digest = createHash("sha256")
    .update(
      JSON.stringify({
        seed,
        case_id: caseId,
        candidate_a: relativeToRepo(candidateAPath),
        candidate_b: relativeToRepo(candidateBPath),
      }),
    )
    .digest("hex");
  const shouldSwap = Number.parseInt(digest.slice(0, 2), 16) % 2 === 1;
  return {
    method: RANDOMIZATION_METHOD,
    seed,
    original_order: originalOrder,
    candidate_order: shouldSwap
      ? ["candidate_b", "candidate_a"]
      : [...originalOrder],
  };
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
    throw new Error(`Could not find ${label} in pairwise prompt`);
  }
  return match[1];
};

const judgeVars = ({
  caseId,
  caseDir,
  model,
  provider,
  promptVersion,
  rubricVersion,
  randomizedOrder,
  candidateAContent,
  candidateBContent,
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
  expected_facts: [
    "## Expected Facts",
    "",
    JSON.stringify(
      readJson(path.join(caseDir, "expected-facts.json")),
      null,
      2,
    ),
    "",
    "## Expected Boundaries",
    "",
    JSON.stringify(
      readJson(path.join(caseDir, "expected-boundaries.json")),
      null,
      2,
    ),
  ].join("\n"),
  candidate_a: candidateAContent,
  candidate_b: candidateBContent,
  randomization_method: randomizedOrder.method,
  randomization_seed: randomizedOrder.seed,
  original_order: randomizedOrder.original_order.join(", "),
  candidate_order: randomizedOrder.candidate_order.join(", "),
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
    description: `technical-design pairwise judge eval for ${caseId}`,
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

const assertDeepEqual = (label, actual, expected) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${label} mismatch: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`,
    );
  }
};

const main = () => {
  const args = parseArgs(process.argv.slice(2));
  const caseId = requireArg(args, "case");
  const candidateAPath = resolveRepoInputPath(
    requireArg(args, "candidate-a"),
    "candidate A path",
  );
  const candidateBPath = resolveRepoInputPath(
    requireArg(args, "candidate-b"),
    "candidate B path",
  );
  const model = requireArg(args, "model");
  const providerArg = requireArg(args, "provider");
  const effort = requireArg(args, "effort");
  const seed = requireArg(args, "seed");
  const runId = requireArg(args, "run-id");

  const authMode = codexAuthMode();
  const provider = normalizeCodexProvider(providerArg);
  const caseDir = resolveCaseDir(caseId);
  const runDir = resolveRunDir(runId);
  const promptPath = resolveRepoPath(
    "internal/evals/promptfoo/judges/pairwise.prompt.md",
  );
  const promptText = readText(promptPath);
  const outputSchema = readJson(
    resolveRepoPath("internal/evals/schemas/pairwise-result.schema.json"),
  );
  const promptVersion = extractVersion(promptText, "Prompt version");
  const rubricVersion = extractVersion(promptText, "Rubric version");
  const randomizedOrder = randomizeCandidateOrder({
    seed,
    caseId,
    candidateAPath,
    candidateBPath,
  });
  const orderedPaths = randomizedOrder.candidate_order.map((candidateId) =>
    candidateId === "candidate_a" ? candidateAPath : candidateBPath,
  );
  const vars = judgeVars({
    caseId,
    caseDir,
    model,
    provider,
    promptVersion,
    rubricVersion,
    randomizedOrder,
    candidateAContent: readText(orderedPaths[0]),
    candidateBContent: readText(orderedPaths[1]),
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
    outputSchema,
    caseId,
  });
  writeJson(outputFiles.config, config);

  runPromptfoo(outputFiles.config);

  const promptfooResults = readJson(outputFiles.json);
  const rawResult = parseJsonOutput(extractPromptfooOutput(promptfooResults));
  const result = validateJsonWithSchema(
    "pairwise-result.schema.json",
    rawResult,
    "pairwise judge result",
  );

  if (result.case_id !== caseId) {
    throw new Error(
      `pairwise result case_id mismatch: expected ${caseId}, received ${result.case_id}`,
    );
  }
  if (result.model !== model) {
    throw new Error(
      `pairwise result model mismatch: expected ${model}, received ${result.model}`,
    );
  }
  if (result.provider !== provider) {
    throw new Error(
      `pairwise result provider mismatch: expected ${provider}, received ${result.provider}`,
    );
  }
  if (result.prompt_version !== promptVersion) {
    throw new Error(
      `pairwise result prompt_version mismatch: expected ${promptVersion}, received ${result.prompt_version}`,
    );
  }
  if (result.rubric_version !== rubricVersion) {
    throw new Error(
      `pairwise result rubric_version mismatch: expected ${rubricVersion}, received ${result.rubric_version}`,
    );
  }
  assertDeepEqual(
    "pairwise result candidate_order",
    result.candidate_order,
    randomizedOrder.candidate_order,
  );
  assertDeepEqual("pairwise result randomization", result.randomization, {
    method: randomizedOrder.method,
    seed: randomizedOrder.seed,
    original_order: randomizedOrder.original_order,
  });

  writeJson(path.join(runDir, "pairwise-result.json"), result);

  const manifest = validateJsonWithSchema(
    "results-manifest.schema.json",
    {
      run_id: runId,
      git_commit: gitCommit(),
      command: commandString(),
      case_ids: [caseId],
      tool_versions: toolVersions(),
      run_type: "judge",
      model_provider: codexProviderId({ provider, model }),
      model,
      provider,
      reasoning_effort: effort,
      sandbox_mode: "read-only",
      approval_policy: "never",
      codex_auth_mode: authMode,
      prompt_version: promptVersion,
      rubric_version: rubricVersion,
      randomization: randomizedOrder,
      output_files: [
        "manifest.json",
        "report.md",
        "pairwise-result.json",
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
      `# Judge Eval Report: ${caseId}`,
      "",
      `Winner: ${result.winner}`,
      `Confidence: ${result.confidence}`,
      `Model: ${model}`,
      `Provider: ${provider}`,
      `Auth mode: ${authMode}`,
      `Prompt version: ${promptVersion}`,
      `Rubric version: ${rubricVersion}`,
      "",
      "## Candidate Order",
      "",
      `- Original order: ${randomizedOrder.original_order.join(", ")}`,
      `- Randomized order: ${randomizedOrder.candidate_order.join(", ")}`,
      `- Candidate A source: ${relativeToRepo(orderedPaths[0])}`,
      `- Candidate B source: ${relativeToRepo(orderedPaths[1])}`,
      "",
      "## Criteria",
      "",
      ...result.criteria.map((criterion) => `- ${criterion}`),
      "",
      "## Evidence",
      "",
      ...result.evidence.map((item) => `- ${item}`),
      "",
      "## Explanation",
      "",
      result.explanation,
    ].join("\n"),
  );

  console.log(`Wrote judge eval results to ${relativeToPackage(runDir)}`);
};

main();
