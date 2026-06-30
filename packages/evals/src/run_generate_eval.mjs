#!/usr/bin/env node
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
  runPromptfoo,
} from "./lib/promptfoo.mjs";
import {
  relativeToPackage,
  relativeToRepo,
  resolveCaseDir,
  resolveRunDir,
  resolveRepoPath,
} from "./lib/paths.mjs";

const PROMPT_VERSION = "generation-prompt-v1";

const buildPrompt =
  () => `You are authoring a technical design from source-grounded inputs only.

Return Markdown only. Do not wrap the whole answer in JSON.

Rules:
- Use only the source-backed facts in the provided inputs.
- Do not use or infer from any hidden reference design, rubric, grader notes, judge rubric, or expected answer file.
- Keep billing, pricing, rewards, and payment integration out of scope unless the provided sources say otherwise.
- Produce a DDD-first technical design that follows the author instructions, the technical design template, and the DDD eval expectations.

Case id: {{case_id}}

## Product Brief

{{product_md}}

## Source Map

{{source_map_md}}

## Author Skill Instructions

{{author_skill_md}}

## Technical Design Template

{{technical_design_template_md}}

## Bounded Context Template

{{bounded_context_template_md}}

## Enforcement Map Template

{{enforcement_map_template_md}}

## DDD Eval Expectations

{{ddd_eval_expectations_md}}
`;

const promptfooOutputFiles = (runDir) => ({
  config: path.join(runDir, "promptfooconfig.json"),
  json: path.join(runDir, "promptfoo-results.json"),
  html: path.join(runDir, "promptfoo-report.html"),
});

const generationInputs = (caseDir) => ({
  product_md: readText(path.join(caseDir, "product.md")),
  source_map_md: readText(path.join(caseDir, "source-map.md")),
  author_skill_md: readText(
    resolveRepoPath("skills/author-technical-design/SKILL.md"),
  ),
  technical_design_template_md: readText(
    resolveRepoPath("methodologies/ddd/templates/technical-design.md"),
  ),
  bounded_context_template_md: readText(
    resolveRepoPath("methodologies/ddd/templates/bounded-context.md"),
  ),
  enforcement_map_template_md: readText(
    resolveRepoPath("methodologies/ddd/templates/enforcement-map.md"),
  ),
  ddd_eval_expectations_md: readText(
    resolveRepoPath("methodologies/ddd/eval-expectations.md"),
  ),
});

const buildPromptfooConfig = ({
  caseId,
  model,
  provider,
  effort,
  runDir,
  vars,
}) => {
  const outputFiles = promptfooOutputFiles(runDir);
  return {
    description: `technical-design generation eval for ${caseId}`,
    prompts: [buildPrompt()],
    providers: [
      {
        id: codexProviderId({ provider, model }),
        config: {
          sandbox_mode: "read-only",
          approval_policy: "never",
          model_reasoning_effort: effort,
        },
      },
    ],
    tests: [
      {
        vars: {
          case_id: caseId,
          ...vars,
        },
      },
    ],
    outputPath: [outputFiles.json, outputFiles.html],
  };
};

const main = () => {
  const args = parseArgs(process.argv.slice(2));
  const caseId = requireArg(args, "case");
  const model = requireArg(args, "model");
  const providerArg = requireArg(args, "provider");
  const effort = requireArg(args, "effort");
  const runId = requireArg(args, "run-id");

  const authMode = codexAuthMode();
  const provider = normalizeCodexProvider(providerArg);
  const caseDir = resolveCaseDir(caseId);
  const runDir = resolveRunDir(runId);
  const caseResultDir = path.join(runDir, "cases", caseId);
  const outputFiles = promptfooOutputFiles(runDir);

  fs.mkdirSync(caseResultDir, { recursive: true });

  const config = buildPromptfooConfig({
    caseId,
    model,
    provider,
    effort,
    runDir,
    vars: generationInputs(caseDir),
  });
  writeJson(outputFiles.config, config);

  runPromptfoo(outputFiles.config);

  const promptfooResults = readJson(outputFiles.json);
  const candidateText = extractPromptfooOutput(promptfooResults).trim();
  if (!candidateText) {
    throw new Error("Promptfoo generation output was empty");
  }

  const candidatePath = path.join(caseResultDir, "candidate.md");
  writeText(candidatePath, `${candidateText}\n`);

  const manifest = validateJsonWithSchema(
    "results-manifest.schema.json",
    {
      run_id: runId,
      git_commit: gitCommit(),
      command: commandString(),
      case_ids: [caseId],
      tool_versions: toolVersions(),
      run_type: "generation",
      model_provider: codexProviderId({ provider, model }),
      model,
      provider,
      reasoning_effort: effort,
      sandbox_mode: "read-only",
      approval_policy: "never",
      codex_auth_mode: authMode,
      prompt_version: PROMPT_VERSION,
      output_files: [
        "manifest.json",
        "report.md",
        "promptfooconfig.json",
        "promptfoo-results.json",
        "promptfoo-report.html",
        `cases/${caseId}/candidate.md`,
      ],
    },
    "manifest",
  );
  writeJson(path.join(runDir, "manifest.json"), manifest);

  writeText(
    path.join(runDir, "report.md"),
    [
      `# Generation Eval Report: ${caseId}`,
      "",
      `Prompt version: ${PROMPT_VERSION}`,
      `Model: ${model}`,
      `Provider: ${provider}`,
      `Auth mode: ${authMode}`,
      "",
      "## Outputs",
      "",
      `- Candidate: ${relativeToRepo(candidatePath)}`,
      `- Promptfoo JSON: ${relativeToRepo(outputFiles.json)}`,
      `- Promptfoo HTML: ${relativeToRepo(outputFiles.html)}`,
      "",
      "## Notes",
      "",
      "- Generation prompt was built from product.md, source-map.md, author instructions, and DDD templates/expectations only.",
      "- Reference design, expected facts, expected boundaries, grader notes, rubric, and judge rubric were excluded from the generation inputs.",
    ].join("\n"),
  );

  console.log(`Wrote generation eval results to ${relativeToPackage(runDir)}`);
};

main();
