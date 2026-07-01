#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

import { defaultRunId, parseArgs, requireArg } from "./lib/args.mjs";
import { validateJsonWithSchema, writeJson } from "./lib/json.mjs";
import { commandString, gitCommit, toolVersions } from "./lib/metadata.mjs";
import { artifactFor, writeEvalKitManifest } from "./lib/result_manifest.mjs";
import {
  relativeToPackage,
  resolveCaseDir,
  resolveRepoInputPath,
  resolveRunDir,
} from "./lib/paths.mjs";
import { gradeTechnicalDesignCandidate } from "./adapters/technical-design/grader-adapter.mjs";
import { renderDeterministicReport } from "./adapters/technical-design/reporter.mjs";

const main = () => {
  const startedAt = new Date();
  const args = parseArgs(process.argv.slice(2));
  const caseId = requireArg(args, "case");
  const candidatePath = resolveRepoInputPath(
    requireArg(args, "candidate"),
    "candidate path",
  );
  const runId = args["run-id"] ?? defaultRunId("deterministic");
  const caseDir = resolveCaseDir(caseId);
  const resultDir = resolveRunDir(runId);
  const caseResultDir = path.join(resultDir, "cases", caseId);

  const expectedFacts = validateJsonWithSchema(
    "expected-facts.schema.json",
    JSON.parse(fs.readFileSync(path.join(caseDir, "expected-facts.json"))),
    "expected facts",
  );
  const expectedBoundaries = validateJsonWithSchema(
    "expected-boundaries.schema.json",
    JSON.parse(fs.readFileSync(path.join(caseDir, "expected-boundaries.json"))),
    "expected boundaries",
  );

  const candidateText = fs.readFileSync(candidatePath, "utf8");
  const { findings, verdict } = gradeTechnicalDesignCandidate({
    candidateText,
    expectedFacts,
    expectedBoundaries,
  });
  const grades = validateJsonWithSchema(
    "grades.schema.json",
    {
      case_id: caseId,
      verdict,
      findings,
    },
    "grades",
  );

  fs.mkdirSync(caseResultDir, { recursive: true });
  fs.copyFileSync(candidatePath, path.join(caseResultDir, "candidate.md"));
  writeJson(path.join(caseResultDir, "grader-output.json"), { findings });
  writeJson(path.join(resultDir, "grades.json"), grades);

  const outputFiles = [
    "manifest.json",
    "grades.json",
    "report.md",
    `cases/${caseId}/candidate.md`,
    `cases/${caseId}/grader-output.json`,
  ];
  fs.writeFileSync(
    path.join(resultDir, "report.md"),
    renderDeterministicReport({
      caseId,
      grades,
      findings,
      caseDir,
      candidatePath,
    }),
  );
  fs.appendFileSync(path.join(resultDir, "report.md"), "\n");

  const artifact = (role, fileName, mediaType) =>
    artifactFor(resultDir, role, fileName, mediaType);
  const endedAt = new Date();
  writeEvalKitManifest({
    runDir: resultDir,
    manifest: {
      schema_version: "eval-kit.result-manifest.v2",
      run_id: runId,
      run_type: "deterministic",
      runner: {
        id: "technical-design-eval-case",
        version: "0.0.0",
      },
      case_ids: [caseId],
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
      duration_ms: endedAt.getTime() - startedAt.getTime(),
      status: "completed",
      git: {
        commit: gitCommit(),
      },
      command: commandString(),
      tool_versions: toolVersions(),
      artifacts: [
        artifact("grades", "grades.json", "application/json"),
        artifact("report", "report.md", "text/markdown"),
        artifact(
          "candidate_markdown",
          `cases/${caseId}/candidate.md`,
          "text/markdown",
        ),
        artifact(
          "grader_output",
          `cases/${caseId}/grader-output.json`,
          "application/json",
        ),
      ],
      output_files: outputFiles,
    },
  });

  console.log(`Wrote eval results to ${relativeToPackage(resultDir)}`);
  if (grades.verdict === "red") {
    process.exit(1);
  }
};

main();
