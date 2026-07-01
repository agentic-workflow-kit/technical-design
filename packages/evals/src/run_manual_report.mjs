#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

import {
  createSchemaRegistry,
  normalizeLegacyManifest,
} from "@agentic-workflow-kit/eval-kit";

import { parseArgs, requireArg } from "./lib/args.mjs";
import { criticalBlockerCount } from "./lib/case_grader.mjs";
import {
  readJson,
  readText,
  validateJsonWithSchema,
  writeJson,
  writeText,
} from "./lib/json.mjs";
import { commandString, gitCommit, toolVersions } from "./lib/metadata.mjs";
import {
  relativeToPackage,
  relativeToRepo,
  resolveRepoPath,
  resolveRunDir,
} from "./lib/paths.mjs";

const optionalRunKeys = [
  "generate",
  "deterministic",
  "judge",
  "judge-coverage",
  "outcome",
];
const judgeFileCandidates = [
  "pairwise-result.json",
  "pairwise.json",
  "judge-output.json",
];
const pointwiseFileCandidates = ["pointwise-result.json", "pointwise.json"];
const reportFileCandidates = ["report.md", "final-report.md"];

const exists = (filePath) => fs.existsSync(filePath);

const asArray = (value) => (Array.isArray(value) ? value : []);

const safeReadText = (filePath) => {
  try {
    return exists(filePath) ? readText(filePath) : null;
  } catch (error) {
    return `ERROR: ${error.message}`;
  }
};

const safeReadJson = (filePath) => {
  if (!exists(filePath)) {
    return { exists: false, value: null, error: null };
  }
  try {
    return { exists: true, value: readJson(filePath), error: null };
  } catch (error) {
    return { exists: true, value: null, error: error.message };
  }
};

const loadValidatedJson = (filePath, schemaFileName, label) => {
  const loaded = safeReadJson(filePath);
  if (!loaded.exists) {
    return { status: "missing", value: null, error: null };
  }
  if (loaded.error) {
    return { status: "invalid", value: null, error: loaded.error };
  }
  try {
    return {
      status: "valid",
      value: validateJsonWithSchema(schemaFileName, loaded.value, label),
      error: null,
    };
  } catch (error) {
    return { status: "invalid", value: null, error: error.message };
  }
};

const evalKitSchemaRegistry = () =>
  createSchemaRegistry({
    schemaRoots: [resolveRepoPath("packages/eval-kit/schemas")],
  });

const loadManifest = (runDir, label) => {
  const manifestPath = path.join(runDir, "manifest.json");
  const loaded = safeReadJson(manifestPath);
  if (!loaded.exists) {
    return { status: "missing", value: null, error: null };
  }
  if (loaded.error) {
    return { status: "invalid", value: null, error: loaded.error };
  }
  try {
    return {
      status: "valid",
      value: validateJsonWithSchema(
        "results-manifest.schema.json",
        loaded.value,
        `${label} manifest`,
      ),
      error: null,
    };
  } catch (legacyError) {
    try {
      const registry = evalKitSchemaRegistry();
      const manifest =
        loaded.value?.schema_version === "eval-kit.result-manifest.v2"
          ? loaded.value
          : normalizeLegacyManifest(loaded.value, runDir);
      return {
        status: "valid",
        value: registry.validateWithSchema(
          "result-manifest.v2.schema.json",
          manifest,
          `${label} manifest`,
        ),
        error: null,
      };
    } catch (v2Error) {
      return {
        status: "invalid",
        value: null,
        error: `${legacyError.message}; ${v2Error.message}`,
      };
    }
  }
};

const findFirstExistingFile = (runDir, candidates) => {
  for (const relativePath of candidates) {
    const absolutePath = path.join(runDir, relativePath);
    if (exists(absolutePath)) {
      return { absolutePath, relativePath };
    }
  }
  return null;
};

const listJsonFiles = (dirPath) => {
  if (!exists(dirPath)) {
    return [];
  }
  const files = [];
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const absolutePath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...listJsonFiles(absolutePath));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(absolutePath);
    }
  }
  return files.sort((a, b) => a.localeCompare(b));
};

const collectLeafMetrics = (value, currentPath = [], entries = []) => {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      collectLeafMetrics(item, [...currentPath, String(index)], entries),
    );
    return entries;
  }
  if (value && typeof value === "object") {
    for (const [key, nestedValue] of Object.entries(value)) {
      collectLeafMetrics(nestedValue, [...currentPath, key], entries);
    }
    return entries;
  }
  entries.push({
    path: currentPath.join("."),
    key: currentPath.at(-1) ?? "",
    value,
  });
  return entries;
};

const metricKindForPath = (metricPath) => {
  if (
    /(^|\.)(input|output|prompt|completion|total)?tokens?$/i.test(metricPath)
  ) {
    return "token";
  }
  if (
    /(^|\.)(duration|runtime|latency|elapsed)(ms|seconds|secs|s)?$/i.test(
      metricPath,
    )
  ) {
    return "runtime";
  }
  if (/(^|\.)(cost|price|usd|estimatedcost|totalcost)$/i.test(metricPath)) {
    return "cost";
  }
  return null;
};

const normalizeMetricValue = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const normalized = Number(value);
    if (Number.isFinite(normalized)) {
      return normalized;
    }
  }
  return value;
};

const collectRunMetrics = (runDir) => {
  const entries = [];
  for (const jsonFile of listJsonFiles(runDir)) {
    const loaded = safeReadJson(jsonFile);
    if (!loaded.exists || loaded.error || loaded.value === null) {
      continue;
    }
    for (const leaf of collectLeafMetrics(loaded.value)) {
      const kind = metricKindForPath(leaf.path);
      if (!kind) {
        continue;
      }
      entries.push({
        kind,
        file: relativeToRepo(jsonFile),
        path: leaf.path,
        value: normalizeMetricValue(leaf.value),
      });
    }
  }
  const deduped = [];
  const seen = new Set();
  for (const entry of entries) {
    const key = `${entry.kind}|${entry.file}|${entry.path}|${String(entry.value)}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(entry);
  }
  return deduped;
};

const summarizeMetrics = (metrics, kind) =>
  metrics
    .filter((entry) => entry.kind === kind)
    .map(
      (entry) => `- ${entry.file} :: ${entry.path} = ${String(entry.value)}`,
    );

const approximateCost = (metrics) => {
  const canonicalCosts = metrics
    .filter(
      (entry) =>
        entry.kind === "cost" &&
        typeof entry.value === "number" &&
        /^results\.results\.\d+\.cost$/.test(entry.path),
    )
    .map((entry) => entry.value);
  if (canonicalCosts.length > 0) {
    const total = canonicalCosts.reduce((sum, value) => sum + value, 0);
    return Number(total.toFixed(6));
  }

  const numericCosts = metrics
    .filter((entry) => entry.kind === "cost" && typeof entry.value === "number")
    .map((entry) => entry.value);
  if (numericCosts.length === 0) {
    return null;
  }
  const total = numericCosts.reduce((sum, value) => sum + value, 0);
  return Number(total.toFixed(6));
};

const parseStatusFromReport = (reportText, labels) => {
  if (!reportText || reportText.startsWith("ERROR:")) {
    return null;
  }
  for (const label of labels) {
    const match = reportText.match(new RegExp(`^${label}:\\s*(.+)$`, "im"));
    if (match) {
      return match[1].trim();
    }
  }
  return null;
};

const loadRunBundle = (label, runId) => {
  if (!runId) {
    return null;
  }
  const runDir = resolveRunDir(runId);
  if (!exists(runDir)) {
    throw new Error(`referenced ${label} run does not exist: ${runId}`);
  }

  const manifest = loadManifest(runDir, label);

  const reportFile = findFirstExistingFile(runDir, reportFileCandidates);
  const reportText = reportFile ? safeReadText(reportFile.absolutePath) : null;

  const grades = loadValidatedJson(
    path.join(runDir, "grades.json"),
    "grades.schema.json",
    `${label} grades`,
  );

  const judgeFile = findFirstExistingFile(runDir, judgeFileCandidates);
  const pairwise = judgeFile
    ? loadValidatedJson(
        judgeFile.absolutePath,
        "pairwise-result.schema.json",
        `${label} pairwise result`,
      )
    : { status: "missing", value: null, error: null };
  const pointwiseFile = findFirstExistingFile(runDir, pointwiseFileCandidates);
  const pointwise = pointwiseFile
    ? loadValidatedJson(
        pointwiseFile.absolutePath,
        "pointwise-judge-result.schema.json",
        `${label} pointwise result`,
      )
    : { status: "missing", value: null, error: null };

  const outcome = loadValidatedJson(
    path.join(runDir, "outcome-study.json"),
    "outcome-study.schema.json",
    `${label} outcome study`,
  );

  const metrics = collectRunMetrics(runDir);

  return {
    label,
    runId,
    runDir,
    manifest,
    reportText,
    reportPath: reportFile?.relativePath ?? null,
    grades,
    pairwise,
    pairwisePath: judgeFile?.relativePath ?? null,
    pointwise,
    pointwisePath: pointwiseFile?.relativePath ?? null,
    outcome,
    metrics,
  };
};

const candidatePathsFromManifest = (bundle) => {
  if (bundle?.manifest.status !== "valid") {
    return [];
  }
  return asArray(bundle.manifest.value.output_files)
    .filter((fileName) => fileName.endsWith("candidate.md"))
    .map((fileName) => path.join(bundle.runDir, fileName))
    .filter((filePath) => exists(filePath));
};

const generationStatus = (bundle) => {
  if (!bundle) {
    return "not requested";
  }
  const reportStatus = parseStatusFromReport(bundle.reportText, [
    "Generation status",
    "Status",
  ]);
  if (reportStatus) {
    return reportStatus;
  }
  if (bundle.manifest.status === "invalid") {
    return `manifest invalid: ${bundle.manifest.error}`;
  }
  if (candidatePathsFromManifest(bundle).length > 0) {
    return "succeeded";
  }
  if (bundle.manifest.status === "valid" || bundle.reportText) {
    return "artifacts present";
  }
  return "missing";
};

const deterministicStatus = (bundle) => {
  if (!bundle) {
    return "not requested";
  }
  if (bundle.grades.status === "valid") {
    const blockerCount = criticalBlockerCount(bundle.grades.value.findings);
    return `${bundle.grades.value.verdict} (${blockerCount} blocker findings)`;
  }
  if (bundle.grades.status === "invalid") {
    return `invalid grades.json: ${bundle.grades.error}`;
  }
  return (
    parseStatusFromReport(bundle.reportText, ["Verdict", "Status"]) ?? "missing"
  );
};

const judgeSummary = (bundle) => {
  if (!bundle) {
    return {
      schemaStatus: "not requested",
      winner: "n/a",
      confidence: null,
      criteria: [],
    };
  }
  if (bundle.pairwise.status === "valid") {
    return {
      schemaStatus: "valid",
      winner: bundle.pairwise.value.winner,
      confidence: bundle.pairwise.value.confidence,
      criteria: bundle.pairwise.value.criteria,
    };
  }
  if (bundle.pairwise.status === "invalid") {
    return {
      schemaStatus: `invalid: ${bundle.pairwise.error}`,
      winner: "unavailable",
      confidence: null,
      criteria: [],
    };
  }
  return {
    schemaStatus: "missing",
    winner: "unavailable",
    confidence: null,
    criteria: [],
  };
};

const verdictOrder = [
  "covered",
  "partial",
  "missing",
  "contradicted",
  "unknown",
];

const pointwiseSummary = (bundle) => {
  if (!bundle) {
    return {
      schemaStatus: "not requested",
      counts: null,
    };
  }
  if (bundle.pointwise.status === "valid") {
    const counts = Object.fromEntries(
      verdictOrder.map((verdict) => [verdict, 0]),
    );
    for (const item of bundle.pointwise.value.items) {
      counts[item.verdict] += 1;
    }
    return {
      schemaStatus: "valid",
      counts,
    };
  }
  if (bundle.pointwise.status === "invalid") {
    return {
      schemaStatus: `invalid: ${bundle.pointwise.error}`,
      counts: null,
    };
  }
  return {
    schemaStatus: "missing",
    counts: null,
  };
};

const summarizePointwiseCounts = (counts) => {
  if (!counts) {
    return "unavailable";
  }
  return verdictOrder
    .map((verdict) => `${verdict}=${counts[verdict]}`)
    .join(", ");
};

const deterministicPointwiseDisagreements = (
  deterministicBundle,
  pointwiseBundle,
) => {
  if (
    !deterministicBundle ||
    deterministicBundle.grades.status !== "valid" ||
    !pointwiseBundle ||
    pointwiseBundle.pointwise.status !== "valid"
  ) {
    return null;
  }

  const findingsById = new Map(
    deterministicBundle.grades.value.findings.map((finding) => [
      finding.id,
      finding,
    ]),
  );
  const disagreements = [];
  for (const item of pointwiseBundle.pointwise.value.items) {
    const finding = findingsById.get(item.item_id);
    if (!finding) {
      disagreements.push(
        `${item.item_id}: deterministic=missing-item, pointwise=${item.verdict}`,
      );
      continue;
    }
    if (finding.verdict !== item.verdict) {
      disagreements.push(
        `${item.item_id}: deterministic=${finding.verdict}, pointwise=${item.verdict}`,
      );
    }
  }
  return disagreements;
};

const outcomeStatus = (bundle) => {
  if (!bundle) {
    return "not requested";
  }
  if (bundle.outcome.status === "valid") {
    return `valid (${bundle.outcome.value.recurring_defects.length} recurring defects, ${bundle.outcome.value.promotion_decisions.length} promotion decisions)`;
  }
  if (bundle.outcome.status === "invalid") {
    return `invalid: ${bundle.outcome.error}`;
  }
  return "missing";
};

const aggregateCaseIds = (bundles) => {
  const caseIds = new Set();
  for (const bundle of bundles) {
    if (bundle?.manifest.status !== "valid") {
      continue;
    }
    for (const caseId of asArray(bundle.manifest.value.case_ids)) {
      caseIds.add(caseId);
    }
  }
  return caseIds.size > 0 ? [...caseIds] : ["manual-report"];
};

const gitCommitLines = (bundles) => {
  const lines = [];
  for (const bundle of bundles) {
    if (!bundle) {
      continue;
    }
    if (bundle.manifest.status === "valid") {
      lines.push(
        `- ${bundle.label} (${bundle.runId}): ${bundle.manifest.value.git_commit}`,
      );
      continue;
    }
    if (bundle.manifest.status === "invalid") {
      lines.push(`- ${bundle.label} (${bundle.runId}): manifest invalid`);
      continue;
    }
    lines.push(`- ${bundle.label} (${bundle.runId}): manifest missing`);
  }
  return lines;
};

const commandLines = (bundles) => {
  const lines = [];
  for (const bundle of bundles) {
    if (!bundle) {
      continue;
    }
    if (bundle.manifest.status === "valid") {
      lines.push(`- ${bundle.label}: ${bundle.manifest.value.command}`);
      continue;
    }
    lines.push(`- ${bundle.label}: unavailable`);
  }
  return lines;
};

const renderMetricSection = (title, lines) => [
  `## ${title}`,
  "",
  ...(lines.length > 0 ? lines : ["- unavailable"]),
  "",
];

const main = () => {
  const args = parseArgs(process.argv.slice(2));
  const runId = requireArg(args, "run-id");

  const bundles = optionalRunKeys.map((key) => loadRunBundle(key, args[key]));
  const [
    generateBundle,
    deterministicBundle,
    judgeBundle,
    pointwiseBundle,
    outcomeBundle,
  ] = bundles;
  const resultDir = resolveRunDir(runId);

  const judge = judgeSummary(judgeBundle);
  const pointwise = pointwiseSummary(pointwiseBundle);
  const disagreements = deterministicPointwiseDisagreements(
    deterministicBundle,
    pointwiseBundle,
  );
  const combinedMetrics = bundles
    .filter(Boolean)
    .flatMap((bundle) => bundle.metrics);
  const tokenLines = summarizeMetrics(combinedMetrics, "token");
  const runtimeLines = summarizeMetrics(combinedMetrics, "runtime");
  const costLines = summarizeMetrics(combinedMetrics, "cost");
  const totalApproximateCost = approximateCost(combinedMetrics);

  const outputFiles = ["manifest.json", "final-report.md"];
  const manifest = validateJsonWithSchema(
    "results-manifest.schema.json",
    {
      run_id: runId,
      git_commit: gitCommit(),
      command: commandString(),
      case_ids: aggregateCaseIds(bundles),
      tool_versions: toolVersions(),
      run_type: "manual-report",
      output_files: outputFiles,
    },
    "manifest",
  );

  const report = [
    `# Final Eval Report: ${runId}`,
    "",
    `Generation status: ${generationStatus(generateBundle)}`,
    `Deterministic verdict: ${deterministicStatus(deterministicBundle)}`,
    `Judge schema-valid: ${judge.schemaStatus}`,
    `Judge winner: ${judge.winner}`,
    `Pointwise judge schema-valid: ${pointwise.schemaStatus}`,
    `Pointwise coverage: ${summarizePointwiseCounts(pointwise.counts)}`,
    `Outcome validation: ${outcomeStatus(outcomeBundle)}`,
    `Git commit: ${manifest.git_commit}`,
    `Approximate cost: ${totalApproximateCost === null ? "unavailable" : totalApproximateCost}`,
    "",
    "Judge result is advisory until human calibration exists.",
    "",
    "## Commands",
    "",
    ...commandLines(bundles),
    "",
    "## Source Run Commits",
    "",
    ...gitCommitLines(bundles),
    "",
    "## Judge Details",
    "",
    `- confidence: ${judge.confidence ?? "unavailable"}`,
    `- criteria: ${judge.criteria.length > 0 ? judge.criteria.join(", ") : "unavailable"}`,
    judgeBundle?.pairwisePath
      ? `- pairwise result: ${relativeToRepo(path.join(judgeBundle.runDir, judgeBundle.pairwisePath))}`
      : "- pairwise result: unavailable",
    pointwiseBundle?.pointwisePath
      ? `- pointwise result: ${relativeToRepo(path.join(pointwiseBundle.runDir, pointwiseBundle.pointwisePath))}`
      : "- pointwise result: unavailable",
    `- pointwise coverage counts: ${summarizePointwiseCounts(pointwise.counts)}`,
    `- deterministic disagreements: ${disagreements ? disagreements.length : "unavailable"}`,
    ...(disagreements && disagreements.length > 0
      ? [
          "",
          "## Deterministic vs Pointwise Disagreements",
          "",
          ...disagreements.map((item) => `- ${item}`),
          "",
        ]
      : [""]),
    ...renderMetricSection("Token Metadata", tokenLines),
    ...renderMetricSection("Runtime Metadata", runtimeLines),
    ...renderMetricSection("Cost Metadata", costLines),
    "## Source Reports",
    "",
    ...bundles
      .filter(Boolean)
      .map((bundle) =>
        bundle.reportPath
          ? `- ${bundle.label}: ${relativeToRepo(path.join(bundle.runDir, bundle.reportPath))}`
          : `- ${bundle.label}: unavailable`,
      ),
  ].join("\n");

  writeJson(path.join(resultDir, "manifest.json"), manifest);
  writeText(path.join(resultDir, "final-report.md"), `${report}\n`);

  console.log(`Wrote manual report to ${relativeToPackage(resultDir)}`);
};

main();
