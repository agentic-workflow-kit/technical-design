#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

import { defaultRunId, parseArgs, requireArg } from "./lib/args.mjs";
import { validateJsonWithSchema, writeJson } from "./lib/json.mjs";
import { commandString, gitCommit, toolVersions } from "./lib/metadata.mjs";
import {
  relativeToPackage,
  relativeToRepo,
  resolveCaseDir,
  resolveRepoInputPath,
  resolveRunDir,
} from "./lib/paths.mjs";

const normalize = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const includesAny = (text, snippets = []) =>
  snippets.some((snippet) => normalize(text).includes(normalize(snippet)));

const includesAll = (text, snippets = []) =>
  snippets.every((snippet) => normalize(text).includes(normalize(snippet)));

const gradeFacts = (candidateText, expectedFacts) =>
  expectedFacts.facts.map((fact) => {
    const forbiddenHit = includesAny(
      candidateText,
      fact.must_not_include_any ?? [],
    );
    const anyRequired = fact.must_include_any ?? [];
    const allRequired = fact.must_include_all ?? [];
    const requiredHit =
      (anyRequired.length === 0 || includesAny(candidateText, anyRequired)) &&
      includesAll(candidateText, allRequired);
    let verdict = "covered";
    let evidence = "required text evidence found";
    if (forbiddenHit) {
      verdict = "contradicted";
      evidence = "forbidden text evidence found";
    } else if (!requiredHit) {
      verdict = "missing";
      evidence = "no required text evidence found";
    }
    return {
      id: fact.id,
      kind: "fact",
      severity: fact.severity,
      verdict,
      evidence,
    };
  });

const gradeBoundaries = (candidateText, expectedBoundaries) =>
  expectedBoundaries.contexts.map((context) => {
    const forbiddenHit = includesAny(
      candidateText,
      context.must_not_include_any ?? [],
    );
    const anyRequired = context.must_include_any ?? [];
    const allRequired = context.must_include_all ?? [
      context.name,
      ...context.owns,
    ];
    const requiredHit =
      (anyRequired.length === 0 || includesAny(candidateText, anyRequired)) &&
      includesAll(candidateText, allRequired);
    return {
      id: context.id,
      kind: "boundary",
      severity: "critical",
      verdict: forbiddenHit
        ? "contradicted"
        : requiredHit
          ? "covered"
          : "missing",
      evidence: forbiddenHit
        ? "forbidden boundary text evidence found"
        : requiredHit
          ? "context ownership text evidence found"
          : "no context ownership text evidence found",
    };
  });

const verdictForFindings = (findings) => {
  if (
    findings.some(
      (finding) =>
        finding.severity === "critical" &&
        ["missing", "contradicted", "invented"].includes(finding.verdict),
    )
  ) {
    return "red";
  }
  if (
    findings.some((finding) =>
      ["missing", "contradicted", "invented", "unknown"].includes(
        finding.verdict,
      ),
    )
  ) {
    return "yellow";
  }
  return "green";
};

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

  const blockerCount = findings.filter((finding) =>
    ["missing", "contradicted", "invented"].includes(finding.verdict),
  ).length;
  fs.writeFileSync(
    path.join(resultDir, "report.md"),
    [
      `# Eval Report: ${caseId}`,
      "",
      `Verdict: ${grades.verdict}`,
      `Blocker findings: ${blockerCount}`,
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
