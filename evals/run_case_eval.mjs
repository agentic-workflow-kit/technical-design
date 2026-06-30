#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), "..");

const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));

const writeJson = (filePath, value) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
};

const parseArgs = (argv) => {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--") {
      continue;
    }
    if (!arg.startsWith("--")) {
      continue;
    }
    args[arg.slice(2)] = argv[index + 1];
    index += 1;
  }
  return args;
};

const usage = () => {
  console.error(
    "usage: node evals/run_case_eval.mjs --case <case-id> --candidate <path> [--run-id <id>]",
  );
};

const normalize = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const includesAny = (text, snippets = []) =>
  snippets.some((snippet) => normalize(text).includes(normalize(snippet)));

const includesAll = (text, snippets = []) =>
  snippets.every((snippet) => normalize(text).includes(normalize(snippet)));

const containsPath = (basePath, childPath) => {
  const relativePath = path.relative(basePath, childPath);
  return (
    relativePath === "" ||
    (!relativePath.startsWith("..") && !path.isAbsolute(relativePath))
  );
};

const validateJson = (schemaRelativePath, data, label) => {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const schema = readJson(schemaRelativePath);
  const validate = ajv.compile(schema);
  if (validate(data)) {
    return;
  }
  const details = (validate.errors ?? [])
    .map((error) => `${error.instancePath || "<root>"} ${error.message}`)
    .join("; ");
  throw new Error(`${label} failed schema validation: ${details}`);
};

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
  if (!args.case || !args.candidate) {
    usage();
    process.exit(2);
  }

  const caseId = args.case;
  const caseDir = path.join(root, "evals/cases", caseId);
  const candidatePath = path.resolve(root, args.candidate);
  const runId =
    args["run-id"] ?? new Date().toISOString().replace(/[:.]/g, "-");
  const resultsRoot = path.join(root, "evals/results");
  const resultDir = path.resolve(resultsRoot, runId);
  if (!containsPath(resultsRoot, resultDir)) {
    throw new Error(`run id escapes evals/results: ${runId}`);
  }
  const caseResultDir = path.join(resultDir, "cases", caseId);

  const expectedFacts = readJson(`evals/cases/${caseId}/expected-facts.json`);
  const expectedBoundaries = readJson(
    `evals/cases/${caseId}/expected-boundaries.json`,
  );
  validateJson(
    "evals/schemas/expected-facts.schema.json",
    expectedFacts,
    "expected facts",
  );
  validateJson(
    "evals/schemas/expected-boundaries.schema.json",
    expectedBoundaries,
    "expected boundaries",
  );

  const candidateText = fs.readFileSync(candidatePath, "utf8");
  const findings = [
    ...gradeFacts(candidateText, expectedFacts),
    ...gradeBoundaries(candidateText, expectedBoundaries),
  ];
  const grades = {
    case_id: caseId,
    verdict: verdictForFindings(findings),
    findings,
  };
  validateJson("evals/schemas/grades.schema.json", grades, "grades");

  const manifest = {
    run_id: runId,
    git_commit: execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: root,
      encoding: "utf8",
    }).trim(),
    command: process.argv.join(" "),
    case_ids: [caseId],
    tool_versions: {
      node: process.version,
    },
    run_type: "deterministic",
    output_files: [
      "manifest.json",
      "grades.json",
      "report.md",
      `cases/${caseId}/candidate.md`,
      `cases/${caseId}/grader-output.json`,
    ],
  };
  validateJson(
    "evals/schemas/results-manifest.schema.json",
    manifest,
    "manifest",
  );

  fs.mkdirSync(caseResultDir, { recursive: true });
  writeJson(path.join(resultDir, "manifest.json"), manifest);
  writeJson(path.join(resultDir, "grades.json"), grades);
  fs.copyFileSync(candidatePath, path.join(caseResultDir, "candidate.md"));
  writeJson(path.join(caseResultDir, "grader-output.json"), { findings });

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
      `Case directory: ${path.relative(root, caseDir)}`,
    ].join("\n"),
  );

  console.log(`Wrote eval results to ${path.relative(root, resultDir)}`);
  if (grades.verdict === "red") {
    process.exit(1);
  }
};

main();
