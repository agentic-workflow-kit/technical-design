#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

import { defaultRunId, parseArgs, requireArg } from "./lib/args.mjs";
import {
  criticalBlockerCount,
  gradeBoundaries,
  gradeFacts,
  verdictForFindings,
} from "./lib/case_grader.mjs";
import { validateJsonWithSchema, writeJson } from "./lib/json.mjs";
import { commandString, gitCommit, toolVersions } from "./lib/metadata.mjs";
import {
  relativeToPackage,
  relativeToRepo,
  resolveCaseDir,
  resolveRepoInputPath,
  resolveRunDir,
} from "./lib/paths.mjs";

const main = () => {
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
  const findings = [
    ...gradeFacts(candidateText, expectedFacts),
    ...gradeBoundaries(candidateText, expectedBoundaries),
  ];
  const grades = validateJsonWithSchema(
    "grades.schema.json",
    {
      case_id: caseId,
      verdict: verdictForFindings(findings),
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
  const manifest = validateJsonWithSchema(
    "results-manifest.schema.json",
    {
      run_id: runId,
      git_commit: gitCommit(),
      command: commandString(),
      case_ids: [caseId],
      tool_versions: toolVersions(),
      run_type: "deterministic",
      output_files: outputFiles,
    },
    "manifest",
  );
  writeJson(path.join(resultDir, "manifest.json"), manifest);

  const blockerCount = criticalBlockerCount(findings);
  const findingCounts = findings.reduce(
    (counts, finding) => ({
      ...counts,
      [finding.verdict]: (counts[finding.verdict] ?? 0) + 1,
    }),
    {},
  );
  fs.writeFileSync(
    path.join(resultDir, "report.md"),
    [
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
      `Case directory: ${relativeToRepo(caseDir)}`,
      `Candidate: ${relativeToRepo(candidatePath)}`,
    ].join("\n"),
  );

  console.log(`Wrote eval results to ${relativeToPackage(resultDir)}`);
  if (grades.verdict === "red") {
    process.exit(1);
  }
};

main();
