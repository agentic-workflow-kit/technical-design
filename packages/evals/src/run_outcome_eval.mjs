#!/usr/bin/env node
import path from "node:path";

import { parseArgs, requireArg } from "./lib/args.mjs";
import {
  readJson,
  validateJsonWithSchema,
  writeJson,
  writeText,
} from "./lib/json.mjs";
import { commandString, gitCommit, toolVersions } from "./lib/metadata.mjs";
import {
  relativeToPackage,
  relativeToRepo,
  resolveRepoInputPath,
  resolveRunDir,
} from "./lib/paths.mjs";

const sanitizeOutcomeStudy = (study) => ({
  ...study,
  source_runs: study.source_runs.map((sourceRun) => ({
    ...sourceRun,
    reference:
      sourceRun.redaction_status === "private-raw-local"
        ? "private raw evidence kept local"
        : sourceRun.reference,
  })),
});

const buildReport = ({ inputPath, outcomeStudy }) => {
  const signalEntries = Object.entries(outcomeStudy.signals);
  const promotedCount = outcomeStudy.promotion_decisions.filter(
    (decision) => decision.decision === "promote",
  ).length;

  return [
    `# Outcome Validation Report: ${outcomeStudy.study_id}`,
    "",
    "Validation status: valid",
    `Input: ${relativeToRepo(inputPath)}`,
    `Source runs: ${outcomeStudy.source_runs.length}`,
    `Recurring defects: ${outcomeStudy.recurring_defects.length}`,
    `Promotion decisions: ${outcomeStudy.promotion_decisions.length}`,
    `Promotions accepted: ${promotedCount}`,
    "",
    "## Signals",
    "",
    ...signalEntries.map(([key, value]) => `- ${key}: ${value}`),
    "",
    "## Source Runs",
    "",
    ...outcomeStudy.source_runs.map(
      (sourceRun) =>
        `- ${sourceRun.id}: ${sourceRun.redaction_status}; ${sourceRun.reference}`,
    ),
    "",
    "## Promotion Decisions",
    "",
    ...(outcomeStudy.promotion_decisions.length > 0
      ? outcomeStudy.promotion_decisions.map(
          (decision) =>
            `- ${decision.defect_id}: ${decision.decision} -> ${decision.target}${decision.rationale ? `; ${decision.rationale}` : ""}`,
        )
      : ["- none"]),
    "",
    "## Recurring Defects",
    "",
    ...(outcomeStudy.recurring_defects.length > 0
      ? outcomeStudy.recurring_defects.map(
          (defect) =>
            `- ${defect.id}: ${defect.description} (${defect.evidence_count} evidence, lesson ${defect.lesson_ref})`,
        )
      : ["- none"]),
  ].join("\n");
};

const main = () => {
  const args = parseArgs(process.argv.slice(2));
  const inputPath = resolveRepoInputPath(requireArg(args, "input"), "input");
  const runId = requireArg(args, "run-id");
  const resultDir = resolveRunDir(runId);

  const outcomeStudy = validateJsonWithSchema(
    "outcome-study.schema.json",
    sanitizeOutcomeStudy(readJson(inputPath)),
    "outcome study",
  );

  const outputFiles = ["manifest.json", "outcome-study.json", "report.md"];
  const manifest = validateJsonWithSchema(
    "results-manifest.schema.json",
    {
      run_id: runId,
      git_commit: gitCommit(),
      command: commandString(),
      case_ids: [outcomeStudy.study_id],
      tool_versions: toolVersions(),
      run_type: "outcome",
      output_files: outputFiles,
    },
    "manifest",
  );

  writeJson(path.join(resultDir, "outcome-study.json"), outcomeStudy);
  writeJson(path.join(resultDir, "manifest.json"), manifest);
  writeText(
    path.join(resultDir, "report.md"),
    `${buildReport({ inputPath, outcomeStudy })}\n`,
  );

  console.log(`Wrote outcome results to ${relativeToPackage(resultDir)}`);
};

main();
