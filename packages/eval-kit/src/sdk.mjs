import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";

import { artifactRecord, writeManifest } from "./artifacts.mjs";
import {
  extractPromptfooOutput,
  parseJsonOutput,
  runPromptfooRaw,
} from "./promptfoo.mjs";
import { aggregateVerdict, criticalBlockerCount } from "./verdict.mjs";
import { assertSafeId, toPosixPath } from "./paths.mjs";

const DEFAULT_SANDBOX_MODE = "read-only";
const DEFAULT_APPROVAL_POLICY = "never";
const RANDOMIZATION_METHOD = "sha256-seed-parity-v1";

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const wildcardPattern = (pattern) =>
  new RegExp(`^${pattern.split("*").map(escapeRegExp).join(".*")}$`);

const matchesAnyPattern = (value, patterns) =>
  patterns.some((pattern) => wildcardPattern(pattern).test(value));

export const configuredCaseManifestPaths = (config) => {
  if (Array.isArray(config.raw.case_manifests)) {
    return [...config.raw.case_manifests].sort();
  }

  const casesConfig = config.raw.cases;
  if (!casesConfig) {
    return [];
  }

  const resolver = config.pathResolver;
  const casesRoot = resolver.resolveSuitePath(casesConfig.root, "cases.root");
  if (!fs.existsSync(casesRoot)) {
    throw new Error(`cases root does not exist: ${casesConfig.root}`);
  }
  if (!fs.statSync(casesRoot).isDirectory()) {
    throw new Error(`cases root is not a directory: ${casesConfig.root}`);
  }

  const include = casesConfig.include ?? ["*"];
  const exclude = casesConfig.exclude ?? [];
  const entries = fs
    .readdirSync(casesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => matchesAnyPattern(name, include))
    .filter((name) => !matchesAnyPattern(name, exclude))
    .sort();

  return entries.map((entryName) =>
    toPosixPath(
      path.relative(
        resolver.suiteRoot,
        path.join(casesRoot, entryName, "case-manifest.json"),
      ),
    ),
  );
};

const loadAdapterModule = async (config, label) => {
  const modulePath = config.raw.adapter ?? config.raw.hooks?.module;
  if (!modulePath) {
    throw new Error(`no adapter configured for ${label}`);
  }
  return config.loadModule(modulePath, label);
};

// Resolve case manifest in a generic way
export const resolveCaseManifest = (config, caseId) => {
  const safeCaseId = assertSafeId(caseId, "case id");
  const resolver = config.pathResolver;

  const manifestPath = configuredCaseManifestPaths(config).find(
    (manifestRelPath) => {
      try {
        const fullPath = resolver.resolveSuitePath(
          manifestRelPath,
          "case manifest",
        );
        if (!fs.existsSync(fullPath)) return false;
        const manifest = JSON.parse(fs.readFileSync(fullPath, "utf8"));
        return manifest.case_id === safeCaseId;
      } catch {
        return false;
      }
    },
  );

  if (!manifestPath) {
    throw new Error(`case manifest not found for case: ${safeCaseId}`);
  }

  const absoluteManifestPath = resolver.resolveSuitePath(
    manifestPath,
    "case manifest",
  );
  const caseDir = path.dirname(absoluteManifestPath);
  const manifest = JSON.parse(fs.readFileSync(absoluteManifestPath, "utf8"));

  config.schemaRegistry.validateWithSchema(
    "case-manifest.schema.json",
    manifest,
    "case manifest",
  );

  const artifacts = manifest.artifacts.map((art) => {
    const artAbsPath = path.resolve(caseDir, art.path);
    if (!fs.existsSync(artAbsPath)) {
      throw new Error(
        `case artifact does not exist: ${art.path} at ${artAbsPath}`,
      );
    }
    return {
      ...art,
      absolutePath: artAbsPath,
    };
  });

  return {
    caseId: manifest.case_id,
    caseDir,
    manifestPath: absoluteManifestPath,
    manifest,
    artifacts,
  };
};

export const discoverCaseIds = (config) => {
  const resolver = config.pathResolver;
  const caseIds = [];
  for (const manifestRelPath of configuredCaseManifestPaths(config)) {
    try {
      const fullPath = resolver.resolveSuitePath(
        manifestRelPath,
        "case manifest",
      );
      if (fs.existsSync(fullPath)) {
        const manifest = JSON.parse(fs.readFileSync(fullPath, "utf8"));
        if (manifest.case_id) {
          caseIds.push(manifest.case_id);
        }
      }
    } catch {
      // Ignore invalid files during discovery
    }
  }
  return caseIds.sort();
};

const getToolVersions = (config) => {
  const resolver = config.pathResolver;
  const versions = { node: process.version };

  const execVersion = (cmd, args, cwd = resolver.repoRoot) => {
    try {
      return execFileSync(cmd, args, {
        cwd,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }).trim();
    } catch {
      return "unavailable";
    }
  };

  versions.pnpm = execVersion("pnpm", ["--version"]);
  versions.codex = execVersion("codex", ["--version"]);

  try {
    const promptfooPath = path.resolve(
      resolver.repoRoot,
      "node_modules/.bin/promptfoo",
    );
    if (fs.existsSync(promptfooPath)) {
      versions.promptfoo = execVersion(
        promptfooPath,
        ["--version"],
        path.dirname(promptfooPath),
      );
    } else {
      versions.promptfoo = "unavailable";
    }
  } catch {
    versions.promptfoo = "unavailable";
  }

  return versions;
};

const getGitCommit = (config) => {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: config.pathResolver.repoRoot,
      encoding: "utf8",
    }).trim();
  } catch {
    return "unknown";
  }
};

const codexAuthMode = (config) => {
  try {
    const result = spawnSync("codex", ["login", "status"], {
      cwd: config.pathResolver.repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    if (result.status !== 0) {
      throw new Error(
        `Codex auth not ready: ${result.stderr || "run codex login"}`,
      );
    }
    const status = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
    return status.toLowerCase().includes("chatgpt") ? "chatgpt-local" : "local";
  } catch (error) {
    throw new Error(`Codex auth check failed: ${error.message}`);
  }
};

const normalizeCodexProvider = (provider) => {
  if (!provider || provider === "openai") {
    return "openai:codex-app-server";
  }
  if (
    provider === "openai:codex-app-server" ||
    provider.startsWith("openai:codex-app-server:")
  ) {
    return provider;
  }
  throw new Error(
    `unsupported provider ${provider}; use openai or openai:codex-app-server`,
  );
};

const codexProviderId = ({ provider, model }) => {
  const normalized = normalizeCodexProvider(provider);
  if (normalized.startsWith("openai:codex-app-server:")) {
    return normalized;
  }
  return `${normalized}:${model}`;
};

// Programmatic SDK implementation

export const runCase = async ({ config, caseId, candidatePath, runId }) => {
  const startedAt = new Date();
  const resolver = config.pathResolver;
  const resolvedCandidatePath = path.resolve(resolver.repoRoot, candidatePath);
  if (!fs.existsSync(resolvedCandidatePath)) {
    throw new Error(`candidate path does not exist: ${candidatePath}`);
  }

  const { artifacts, caseDir } = resolveCaseManifest(config, caseId);
  const resultDir = resolver.resolveRunDir(runId);
  const caseResultDir = path.join(resultDir, "cases", caseId);

  // Load configured grader and reporter
  const graderName =
    config.raw.methods?.deterministic?.grader ??
    config.raw.runner_defaults?.grader ??
    Object.keys(config.raw.graders ?? {})[0];
  const reporterName =
    config.raw.methods?.deterministic?.reporter ??
    config.raw.runner_defaults?.reporter ??
    Object.keys(config.raw.reporters ?? {})[0];

  const adapterModule = config.raw.adapter
    ? await loadAdapterModule(config, "adapter")
    : null;
  const graderModule =
    adapterModule ??
    (graderName && config.raw.graders?.[graderName]
      ? await config.loadModule(
          config.raw.graders[graderName],
          `grader ${graderName}`,
        )
      : null);
  const reporterModule =
    adapterModule ??
    (reporterName && config.raw.reporters?.[reporterName]
      ? await config.loadModule(
          config.raw.reporters[reporterName],
          `reporter ${reporterName}`,
        )
      : null);

  if (!graderModule) {
    throw new Error("no grader configured in config");
  }
  if (!reporterModule) {
    throw new Error("no reporter configured in config");
  }

  // Resolve inputs for grader
  const graderInputArtifacts = artifacts.filter(
    (a) => a.role === "grader_input",
  );
  const graderInputs = {};
  for (const art of graderInputArtifacts) {
    const key = path
      .basename(art.path, ".json")
      .replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    graderInputs[key] = JSON.parse(fs.readFileSync(art.absolutePath, "utf8"));
  }

  const candidateText = fs.readFileSync(resolvedCandidatePath, "utf8");

  // Call dynamic grader
  // Standard interface: gradeCandidate({ candidateText, expectedFacts, expectedBoundaries, ... })
  const graderFunc =
    graderModule.gradeTechnicalDesignCandidate ||
    graderModule.gradeCandidate ||
    graderModule.default;
  if (typeof graderFunc !== "function") {
    throw new Error(`grader module does not export a grading function`);
  }

  const { findings, verdict } = graderFunc({
    candidateText,
    ...graderInputs,
  });

  // Structural check of output grades
  const grades = {
    case_id: caseId,
    verdict,
    findings,
  };
  config.schemaRegistry.validateWithSchema(
    "grades.schema.json",
    grades,
    "grades",
  );

  fs.mkdirSync(caseResultDir, { recursive: true });
  fs.copyFileSync(
    resolvedCandidatePath,
    path.join(caseResultDir, "candidate.md"),
  );
  fs.writeFileSync(
    path.join(caseResultDir, "grader-output.json"),
    JSON.stringify({ findings }, null, 2) + "\n",
  );
  fs.writeFileSync(
    path.join(resultDir, "grades.json"),
    JSON.stringify(grades, null, 2) + "\n",
  );

  const outputFiles = [
    "manifest.json",
    "grades.json",
    "report.md",
    `cases/${caseId}/candidate.md`,
    `cases/${caseId}/grader-output.json`,
  ];

  // Call dynamic reporter
  const reporterFunc =
    reporterModule.renderDeterministicReport ||
    reporterModule.renderReport ||
    reporterModule.default;
  if (typeof reporterFunc !== "function") {
    throw new Error(
      "reporter module does not export a report rendering function",
    );
  }

  const reportContent = reporterFunc({
    caseId,
    grades,
    findings,
    caseDir,
    candidatePath: resolvedCandidatePath,
    resolver,
  });

  fs.writeFileSync(path.join(resultDir, "report.md"), reportContent + "\n");

  const endedAt = new Date();
  const artRecord = (role, fileName, mediaType) =>
    artifactRecord({
      role,
      path: fileName,
      runDir: resultDir,
      mediaType,
      redactionStatus: role.startsWith("raw_") ? "raw-local" : "public-safe",
    });

  writeManifest({
    runDir: resultDir,
    schemaRegistry: config.schemaRegistry,
    manifest: {
      schema_version: "eval-kit.result-manifest.v2",
      run_id: runId,
      run_type: "deterministic",
      runner: {
        id: `${config.raw.suite_id}-eval-case`,
        version: "0.0.0",
      },
      case_ids: [caseId],
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
      duration_ms: endedAt.getTime() - startedAt.getTime(),
      status: "completed",
      git: { commit: getGitCommit(config) },
      command: process.argv.join(" "),
      tool_versions: getToolVersions(config),
      artifacts: [
        artRecord("grades", "grades.json", "application/json"),
        artRecord("report", "report.md", "text/markdown"),
        artRecord(
          "candidate_markdown",
          `cases/${caseId}/candidate.md`,
          "text/markdown",
        ),
        artRecord(
          "grader_output",
          `cases/${caseId}/grader-output.json`,
          "application/json",
        ),
      ],
      output_files: outputFiles,
    },
  });

  return { verdict, findings, resultDir };
};

export const generateCandidate = async ({
  config,
  caseId,
  model,
  provider: providerArg,
  effort,
  runId,
}) => {
  const startedAt = new Date();
  const resolver = config.pathResolver;
  const authMode = codexAuthMode(config);
  const provider = normalizeCodexProvider(providerArg);

  const { artifacts, caseDir } = resolveCaseManifest(config, caseId);
  const resultDir = resolver.resolveRunDir(runId);
  const caseResultDir = path.join(resultDir, "cases", caseId);
  fs.mkdirSync(caseResultDir, { recursive: true });

  const promptTemplatePath = config.resolvePromptTemplate(
    "generation",
    "generation.prompt.md",
  );
  const promptText = fs.readFileSync(promptTemplatePath, "utf8");

  // Load custom adapter
  const hooks = await loadAdapterModule(config, "adapter");

  if (typeof hooks.resolveGenerationVars !== "function") {
    throw new Error(
      "adapter module does not export resolveGenerationVars function",
    );
  }

  const vars = await hooks.resolveGenerationVars({
    caseId,
    caseDir,
    artifacts,
    resolver,
  });

  // Create promptfoo config
  const promptfooConfigPath = path.join(resultDir, "promptfooconfig.json");
  const promptfooResultsPath = path.join(resultDir, "promptfoo-results.json");
  const promptfooReportPath = path.join(resultDir, "promptfoo-report.html");

  const promptfooConfig = {
    description: `${config.raw.suite_id} generation eval for ${caseId}`,
    prompts: [promptText],
    providers: [
      {
        id: codexProviderId({ provider, model }),
        config: {
          sandbox_mode: DEFAULT_SANDBOX_MODE,
          approval_policy: DEFAULT_APPROVAL_POLICY,
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
    outputPath: [promptfooResultsPath, promptfooReportPath],
  };

  fs.writeFileSync(
    promptfooConfigPath,
    JSON.stringify(promptfooConfig, null, 2) + "\n",
  );

  const promptfooBin = path.resolve(
    resolver.repoRoot,
    "node_modules/.bin/promptfoo",
  );
  runPromptfooRaw({
    promptfooBin,
    cwd: resolver.repoRoot,
    configPath: promptfooConfigPath,
    env: { PROMPTFOO_DISABLE_TELEMETRY: "1" },
  });

  const promptfooResults = JSON.parse(
    fs.readFileSync(promptfooResultsPath, "utf8"),
  );
  const candidateText = extractPromptfooOutput(promptfooResults).trim();
  if (!candidateText) {
    throw new Error("Promptfoo generation output was empty");
  }

  const candidatePath = path.join(caseResultDir, "candidate.md");
  fs.writeFileSync(candidatePath, `${candidateText}\n`);

  fs.writeFileSync(
    path.join(resultDir, "report.md"),
    [
      `# Generation Eval Report: ${caseId}`,
      "",
      `Model: ${model}`,
      `Provider: ${provider}`,
      `Auth mode: ${authMode}`,
      "",
      "## Outputs",
      "",
      `- Candidate: ${resolver.relativeToRepo(candidatePath)}`,
      `- Promptfoo JSON: ${resolver.relativeToRepo(promptfooResultsPath)}`,
      `- Promptfoo HTML: ${resolver.relativeToRepo(promptfooReportPath)}`,
    ].join("\n") + "\n",
  );

  const endedAt = new Date();
  const artRecord = (role, fileName, mediaType) =>
    artifactRecord({
      role,
      path: fileName,
      runDir: resultDir,
      mediaType,
      redactionStatus: role.startsWith("raw_") ? "raw-local" : "public-safe",
    });

  writeManifest({
    runDir: resultDir,
    schemaRegistry: config.schemaRegistry,
    manifest: {
      schema_version: "eval-kit.result-manifest.v2",
      run_id: runId,
      run_type: "generation",
      runner: {
        id: `${config.raw.suite_id}-generate`,
        version: "0.0.0",
      },
      case_ids: [caseId],
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
      duration_ms: endedAt.getTime() - startedAt.getTime(),
      status: "completed",
      git: { commit: getGitCommit(config) },
      command: process.argv.join(" "),
      tool_versions: getToolVersions(config),
      model_provider: codexProviderId({ provider, model }),
      model,
      provider,
      reasoning_effort: effort,
      sandbox_mode: DEFAULT_SANDBOX_MODE,
      approval_policy: DEFAULT_APPROVAL_POLICY,
      codex_auth_mode: authMode,
      artifacts: [
        artRecord("report", "report.md", "text/markdown"),
        artRecord(
          "promptfoo_config",
          "promptfooconfig.json",
          "application/json",
        ),
        artRecord(
          "raw_promptfoo_results",
          "promptfoo-results.json",
          "application/json",
        ),
        artRecord(
          "promptfoo_html_report",
          "promptfoo-report.html",
          "text/html",
        ),
        artRecord(
          "candidate_markdown",
          `cases/${caseId}/candidate.md`,
          "text/markdown",
        ),
      ],
      output_files: [
        "manifest.json",
        "report.md",
        "promptfooconfig.json",
        "promptfoo-results.json",
        "promptfoo-report.html",
        `cases/${caseId}/candidate.md`,
      ],
    },
  });

  return { candidatePath, resultDir };
};

export const judgeCoverage = async ({
  config,
  caseId,
  candidatePath,
  model,
  provider: providerArg,
  effort,
  runId,
}) => {
  const startedAt = new Date();
  const resolver = config.pathResolver;
  const authMode = codexAuthMode(config);
  const provider = normalizeCodexProvider(providerArg);

  const resolvedCandidatePath = path.resolve(resolver.repoRoot, candidatePath);
  const { artifacts, caseDir } = resolveCaseManifest(config, caseId);
  const resultDir = resolver.resolveRunDir(runId);
  const caseResultDir = path.join(resultDir, "cases", caseId);
  fs.mkdirSync(caseResultDir, { recursive: true });

  const promptTemplatePath = config.resolvePromptTemplate(
    "pointwise_judge",
    "judges/pointwise.prompt.md",
  );
  const promptText = fs.readFileSync(promptTemplatePath, "utf8");

  // Find version from prompt file (looks for "Prompt version: `...`" or similar)
  const extractVersion = (text, label) => {
    const matches = [
      ...text.matchAll(new RegExp(`${label}:\\s*\\\`([^\\\`]+)\\\``, "g")),
    ];
    const match = matches.find((cand) => !cand[1].includes("{{"));
    if (!match) throw new Error(`Could not find ${label} in prompt`);
    return match[1];
  };

  const promptVersion = extractVersion(promptText, "Prompt version");
  const rubricVersion = extractVersion(promptText, "Rubric version");

  const outputSchemaPath = config.resolveKitSchemaPath(
    "pointwise-judge-result.schema.json",
  );
  const outputSchema = JSON.parse(fs.readFileSync(outputSchemaPath, "utf8"));

  // Load custom adapter
  const hooks = await loadAdapterModule(config, "adapter");

  if (typeof hooks.resolvePointwiseVars !== "function") {
    throw new Error(
      "adapter module does not export resolvePointwiseVars function",
    );
  }

  const vars = await hooks.resolvePointwiseVars({
    caseId,
    caseDir,
    artifacts,
    candidateContent: fs.readFileSync(resolvedCandidatePath, "utf8"),
    candidatePath: resolvedCandidatePath,
    promptVersion,
    rubricVersion,
    model,
    provider,
    resolver,
  });

  const promptfooConfigPath = path.join(resultDir, "promptfooconfig.json");
  const promptfooResultsPath = path.join(resultDir, "promptfoo-results.json");
  const promptfooReportPath = path.join(resultDir, "promptfoo-report.html");

  // Strip unsupported allOf fields from schema for API compatibility
  const cleanSchema = (val) => {
    if (Array.isArray(val)) return val.map(cleanSchema);
    if (val && typeof val === "object") {
      return Object.fromEntries(
        Object.entries(val)
          .filter(([k]) => k !== "allOf")
          .map(([k, v]) => [k, cleanSchema(v)]),
      );
    }
    return val;
  };

  const promptfooConfig = {
    description: `${config.raw.suite_id} pointwise judge for ${caseId}`,
    prompts: [promptTemplatePath],
    providers: [
      {
        id: codexProviderId({ provider, model }),
        config: {
          sandbox_mode: DEFAULT_SANDBOX_MODE,
          approval_policy: DEFAULT_APPROVAL_POLICY,
          model_reasoning_effort: effort,
          output_schema: cleanSchema(outputSchema),
        },
      },
    ],
    tests: [{ vars }],
    outputPath: [promptfooResultsPath, promptfooReportPath],
  };

  fs.writeFileSync(
    promptfooConfigPath,
    JSON.stringify(promptfooConfig, null, 2) + "\n",
  );

  const promptfooBin = path.resolve(
    resolver.repoRoot,
    "node_modules/.bin/promptfoo",
  );
  runPromptfooRaw({
    promptfooBin,
    cwd: resolver.repoRoot,
    configPath: promptfooConfigPath,
    env: { PROMPTFOO_DISABLE_TELEMETRY: "1" },
  });

  const promptfooResults = JSON.parse(
    fs.readFileSync(promptfooResultsPath, "utf8"),
  );
  const rawResult = parseJsonOutput(extractPromptfooOutput(promptfooResults));

  const result = config.schemaRegistry.validateWithSchema(
    "pointwise-judge-result.schema.json",
    rawResult,
    "pointwise judge result",
  );

  // Validate properties match run config
  if (result.case_id !== caseId) throw new Error("case_id mismatch in result");
  if (result.model !== model) throw new Error("model mismatch in result");

  // Post-process pointwise items if the adapter provides custom canonicalization
  let finalResult = result;
  if (typeof hooks.canonicalizeExpectedItemMetadata === "function") {
    finalResult = {
      ...result,
      items: hooks.canonicalizeExpectedItemMetadata(
        result.items,
        vars._expectedItemsForCanonicalization,
      ),
    };
  }

  const pointwiseResultPath = path.join(resultDir, "pointwise-result.json");
  fs.writeFileSync(
    pointwiseResultPath,
    JSON.stringify(finalResult, null, 2) + "\n",
  );

  const counts = {
    covered: 0,
    partial: 0,
    missing: 0,
    contradicted: 0,
    unknown: 0,
  };
  for (const item of finalResult.items) {
    counts[item.verdict] = (counts[item.verdict] ?? 0) + 1;
  }

  fs.writeFileSync(
    path.join(resultDir, "report.md"),
    [
      `# Pointwise Judge Report: ${caseId}`,
      "",
      `Model: ${model}`,
      `Provider: ${provider}`,
      `Auth mode: ${authMode}`,
      `Prompt version: ${promptVersion}`,
      `Rubric version: ${rubricVersion}`,
      `Candidate: ${resolver.relativeToRepo(resolvedCandidatePath)}`,
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
      ...finalResult.items.map(
        (item) =>
          `- ${item.item_id} (${item.kind}, ${item.severity}): ${item.verdict} [${item.confidence}]${item.candidate_evidence?.length > 0 ? ` evidence=${item.candidate_evidence.join(" | ")}` : ""} explanation=${item.explanation}`,
      ),
    ].join("\n") + "\n",
  );

  const endedAt = new Date();
  const artRecord = (role, fileName, mediaType) =>
    artifactRecord({
      role,
      path: fileName,
      runDir: resultDir,
      mediaType,
      redactionStatus: role.startsWith("raw_") ? "raw-local" : "public-safe",
    });

  writeManifest({
    runDir: resultDir,
    schemaRegistry: config.schemaRegistry,
    manifest: {
      schema_version: "eval-kit.result-manifest.v2",
      run_id: runId,
      run_type: "judge-coverage",
      runner: {
        id: `${config.raw.suite_id}-pointwise-judge`,
        version: "0.0.0",
      },
      case_ids: [caseId],
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
      duration_ms: endedAt.getTime() - startedAt.getTime(),
      status: "completed",
      git: { commit: getGitCommit(config) },
      command: process.argv.join(" "),
      tool_versions: getToolVersions(config),
      model_provider: codexProviderId({ provider, model }),
      model,
      provider,
      reasoning_effort: effort,
      sandbox_mode: DEFAULT_SANDBOX_MODE,
      approval_policy: DEFAULT_APPROVAL_POLICY,
      codex_auth_mode: authMode,
      prompt_version: promptVersion,
      rubric_version: rubricVersion,
      artifacts: [
        artRecord("report", "report.md", "text/markdown"),
        artRecord(
          "pointwise_result",
          "pointwise-result.json",
          "application/json",
        ),
        artRecord(
          "promptfoo_config",
          "promptfooconfig.json",
          "application/json",
        ),
        artRecord(
          "raw_promptfoo_results",
          "promptfoo-results.json",
          "application/json",
        ),
        artRecord(
          "promptfoo_html_report",
          "promptfoo-report.html",
          "text/html",
        ),
      ],
      output_files: [
        "manifest.json",
        "report.md",
        "pointwise-result.json",
        "promptfooconfig.json",
        "promptfoo-results.json",
        "promptfoo-report.html",
      ],
    },
  });

  return { resultDir, finalResult };
};

export const judgePairwise = async ({
  config,
  caseId,
  candidateAPath,
  candidateBPath,
  model,
  provider: providerArg,
  effort,
  seed,
  runId,
}) => {
  const startedAt = new Date();
  const resolver = config.pathResolver;
  const authMode = codexAuthMode(config);
  const provider = normalizeCodexProvider(providerArg);

  const resolvedCandidateAPath = path.resolve(
    resolver.repoRoot,
    candidateAPath,
  );
  const resolvedCandidateBPath = path.resolve(
    resolver.repoRoot,
    candidateBPath,
  );

  const { artifacts, caseDir } = resolveCaseManifest(config, caseId);
  const resultDir = resolver.resolveRunDir(runId);
  fs.mkdirSync(resultDir, { recursive: true });

  const promptTemplatePath = config.resolvePromptTemplate(
    "pairwise_judge",
    "judges/pairwise.prompt.md",
  );
  const promptText = fs.readFileSync(promptTemplatePath, "utf8");

  const extractVersion = (text, label) => {
    const matches = [
      ...text.matchAll(new RegExp(`${label}:\\s*\\\`([^\\\`]+)\\\``, "g")),
    ];
    const match = matches.find((cand) => !cand[1].includes("{{"));
    if (!match) throw new Error(`Could not find ${label} in prompt`);
    return match[1];
  };

  const promptVersion = extractVersion(promptText, "Prompt version");
  const rubricVersion = extractVersion(promptText, "Rubric version");

  const outputSchemaPath = config.resolveKitSchemaPath(
    "pairwise-result.schema.json",
  );
  const outputSchema = JSON.parse(fs.readFileSync(outputSchemaPath, "utf8"));

  // Randomize candidate order using sha256 of paths and seed
  const originalOrder = ["candidate_a", "candidate_b"];
  const digest = createHash("sha256")
    .update(
      JSON.stringify({
        seed,
        case_id: caseId,
        candidate_a: resolver.relativeToRepo(resolvedCandidateAPath),
        candidate_b: resolver.relativeToRepo(resolvedCandidateBPath),
      }),
    )
    .digest("hex");
  const shouldSwap = Number.parseInt(digest.slice(0, 2), 16) % 2 === 1;
  const candidateOrder = shouldSwap
    ? ["candidate_b", "candidate_a"]
    : ["candidate_a", "candidate_b"];

  const randomizedOrder = {
    method: RANDOMIZATION_METHOD,
    seed,
    original_order: originalOrder,
    candidate_order: candidateOrder,
  };

  // Load custom adapter
  const hooks = await loadAdapterModule(config, "adapter");

  if (typeof hooks.resolvePairwiseVars !== "function") {
    throw new Error(
      "adapter module does not export resolvePairwiseVars function",
    );
  }

  const vars = await hooks.resolvePairwiseVars({
    caseId,
    caseDir,
    artifacts,
    candidateAContent: fs.readFileSync(resolvedCandidateAPath, "utf8"),
    candidateBContent: fs.readFileSync(resolvedCandidateBPath, "utf8"),
    candidateAPath: resolvedCandidateAPath,
    candidateBPath: resolvedCandidateBPath,
    promptVersion,
    rubricVersion,
    model,
    provider,
    randomizedOrder,
    resolver,
  });

  const promptfooConfigPath = path.join(resultDir, "promptfooconfig.json");
  const promptfooResultsPath = path.join(resultDir, "promptfoo-results.json");
  const promptfooReportPath = path.join(resultDir, "promptfoo-report.html");

  const cleanSchema = (val) => {
    if (Array.isArray(val)) return val.map(cleanSchema);
    if (val && typeof val === "object") {
      return Object.fromEntries(
        Object.entries(val)
          .filter(([k]) => k !== "allOf")
          .map(([k, v]) => [k, cleanSchema(v)]),
      );
    }
    return val;
  };

  const promptfooConfig = {
    description: `${config.raw.suite_id} pairwise judge for ${caseId}`,
    prompts: [promptTemplatePath],
    providers: [
      {
        id: codexProviderId({ provider, model }),
        config: {
          sandbox_mode: DEFAULT_SANDBOX_MODE,
          approval_policy: DEFAULT_APPROVAL_POLICY,
          model_reasoning_effort: effort,
          output_schema: cleanSchema(outputSchema),
        },
      },
    ],
    tests: [{ vars }],
    outputPath: [promptfooResultsPath, promptfooReportPath],
  };

  fs.writeFileSync(
    promptfooConfigPath,
    JSON.stringify(promptfooConfig, null, 2) + "\n",
  );

  const promptfooBin = path.resolve(
    resolver.repoRoot,
    "node_modules/.bin/promptfoo",
  );
  runPromptfooRaw({
    promptfooBin,
    cwd: resolver.repoRoot,
    configPath: promptfooConfigPath,
    env: { PROMPTFOO_DISABLE_TELEMETRY: "1" },
  });

  const promptfooResults = JSON.parse(
    fs.readFileSync(promptfooResultsPath, "utf8"),
  );
  const rawResult = parseJsonOutput(extractPromptfooOutput(promptfooResults));

  const pairwiseOutput = config.schemaRegistry.validateWithSchema(
    "pairwise-result.schema.json",
    rawResult,
    "pairwise judge output",
  );

  const assertMatchingValue = (label, actual, expected) => {
    if (actual !== expected) {
      throw new Error(
        `${label} mismatch in pairwise judge output: expected ${expected}, received ${actual}`,
      );
    }
  };

  const assertMatchingArray = (label, actual, expected) => {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(
        `${label} mismatch in pairwise judge output: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`,
      );
    }
  };

  assertMatchingValue("case_id", pairwiseOutput.case_id, caseId);
  assertMatchingValue("model", pairwiseOutput.model, model);
  assertMatchingValue("provider", pairwiseOutput.provider, provider);
  assertMatchingValue(
    "prompt_version",
    pairwiseOutput.prompt_version,
    promptVersion,
  );
  assertMatchingValue(
    "rubric_version",
    pairwiseOutput.rubric_version,
    rubricVersion,
  );
  assertMatchingArray(
    "candidate_order",
    pairwiseOutput.candidate_order,
    randomizedOrder.candidate_order,
  );
  assertMatchingValue(
    "randomization.method",
    pairwiseOutput.randomization.method,
    randomizedOrder.method,
  );
  assertMatchingValue(
    "randomization.seed",
    String(pairwiseOutput.randomization.seed),
    String(randomizedOrder.seed),
  );
  assertMatchingArray(
    "randomization.original_order",
    pairwiseOutput.randomization.original_order,
    randomizedOrder.original_order,
  );
  assertMatchingArray(
    "randomization.candidate_order",
    pairwiseOutput.randomization.candidate_order,
    randomizedOrder.candidate_order,
  );

  let winner = pairwiseOutput.winner;
  if (shouldSwap && (winner === "candidate_a" || winner === "candidate_b")) {
    winner = winner === "candidate_a" ? "candidate_b" : "candidate_a";
  }

  const pairwiseResult = {
    ...pairwiseOutput,
    candidate_order: originalOrder,
    randomization: randomizedOrder,
    winner,
  };

  config.schemaRegistry.validateWithSchema(
    "pairwise-result.schema.json",
    pairwiseResult,
    "pairwise result",
  );

  const pairwiseResultPath = path.join(resultDir, "pairwise-result.json");
  fs.writeFileSync(
    pairwiseResultPath,
    JSON.stringify(pairwiseResult, null, 2) + "\n",
  );

  fs.writeFileSync(
    path.join(resultDir, "report.md"),
    [
      `# Pairwise Judge Report: ${caseId}`,
      "",
      `Model: ${model}`,
      `Provider: ${provider}`,
      `Auth mode: ${authMode}`,
      `Prompt version: ${promptVersion}`,
      `Rubric version: ${rubricVersion}`,
      `Seed: ${seed}`,
      `Randomization swapped: ${shouldSwap}`,
      "",
      `Winner: ${winner}`,
      `Confidence: ${pairwiseResult.confidence}`,
      `Explanation: ${pairwiseResult.explanation}`,
    ].join("\n") + "\n",
  );

  const endedAt = new Date();
  const artRecord = (role, fileName, mediaType) =>
    artifactRecord({
      role,
      path: fileName,
      runDir: resultDir,
      mediaType,
      redactionStatus: role.startsWith("raw_") ? "raw-local" : "public-safe",
    });

  writeManifest({
    runDir: resultDir,
    schemaRegistry: config.schemaRegistry,
    manifest: {
      schema_version: "eval-kit.result-manifest.v2",
      run_id: runId,
      run_type: "judge",
      runner: {
        id: `${config.raw.suite_id}-pairwise-judge`,
        version: "0.0.0",
      },
      case_ids: [caseId],
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
      duration_ms: endedAt.getTime() - startedAt.getTime(),
      status: "completed",
      git: { commit: getGitCommit(config) },
      command: process.argv.join(" "),
      tool_versions: getToolVersions(config),
      model_provider: codexProviderId({ provider, model }),
      model,
      provider,
      reasoning_effort: effort,
      sandbox_mode: DEFAULT_SANDBOX_MODE,
      approval_policy: DEFAULT_APPROVAL_POLICY,
      codex_auth_mode: authMode,
      prompt_version: promptVersion,
      rubric_version: rubricVersion,
      artifacts: [
        artRecord("report", "report.md", "text/markdown"),
        artRecord(
          "pairwise_result",
          "pairwise-result.json",
          "application/json",
        ),
        artRecord(
          "promptfoo_config",
          "promptfooconfig.json",
          "application/json",
        ),
        artRecord(
          "raw_promptfoo_results",
          "promptfoo-results.json",
          "application/json",
        ),
        artRecord(
          "promptfoo_html_report",
          "promptfoo-report.html",
          "text/html",
        ),
      ],
      output_files: [
        "manifest.json",
        "report.md",
        "pairwise-result.json",
        "promptfooconfig.json",
        "promptfoo-results.json",
        "promptfoo-report.html",
      ],
    },
  });

  return { resultDir, pairwiseResult };
};

export const compileReport = async ({ config, runId, runs }) => {
  const startedAt = new Date();
  const resolver = config.pathResolver;
  const resultDir = resolver.resolveRunDir(runId);
  fs.mkdirSync(resultDir, { recursive: true });

  // Load custom adapter
  const hooks = await loadAdapterModule(config, "adapter");

  if (typeof hooks.compileReport !== "function") {
    throw new Error("adapter module does not export compileReport function");
  }

  const {
    reportContent,
    caseIds,
    artifacts: extraArtifacts,
    outputFiles: extraOutputFiles,
  } = await hooks.compileReport({
    config,
    runId,
    runs,
    resultDir,
    resolver,
  });

  fs.writeFileSync(path.join(resultDir, "report.md"), reportContent + "\n");

  const endedAt = new Date();
  const artRecord = (role, fileName, mediaType) =>
    artifactRecord({
      role,
      path: fileName,
      runDir: resultDir,
      mediaType,
      redactionStatus: role.startsWith("raw_") ? "raw-local" : "public-safe",
    });

  const artifacts = [
    artRecord("report", "report.md", "text/markdown"),
    ...extraArtifacts.map((art) =>
      artRecord(art.role, art.path, art.mediaType),
    ),
  ];

  writeManifest({
    runDir: resultDir,
    schemaRegistry: config.schemaRegistry,
    manifest: {
      schema_version: "eval-kit.result-manifest.v2",
      run_id: runId,
      run_type: "manual-report",
      runner: {
        id: `${config.raw.suite_id}-manual-report`,
        version: "0.0.0",
      },
      case_ids: caseIds,
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
      duration_ms: endedAt.getTime() - startedAt.getTime(),
      status: "completed",
      git: { commit: getGitCommit(config) },
      command: process.argv.join(" "),
      tool_versions: getToolVersions(config),
      artifacts,
      output_files: ["manifest.json", "report.md", ...extraOutputFiles],
    },
  });

  return { resultDir };
};

export const validateFixtures = async ({ config }) => {
  const manifests = [];
  for (const manifestRelPath of configuredCaseManifestPaths(config)) {
    const fullPath = config.pathResolver.resolveSuitePath(
      manifestRelPath,
      "case manifest",
    );
    if (!fs.existsSync(fullPath)) {
      throw new Error(`configured case manifest not found: ${manifestRelPath}`);
    }
    const manifest = JSON.parse(fs.readFileSync(fullPath, "utf8"));
    config.schemaRegistry.validateWithSchema(
      "case-manifest.schema.json",
      manifest,
      `case manifest ${manifestRelPath}`,
    );
    manifests.push({ manifest, fullPath, relativePath: manifestRelPath });
  }

  // Load custom adapter
  const hooks =
    (config.raw.adapter ?? config.raw.hooks?.module)
      ? await loadAdapterModule(config, "adapter")
      : {};

  if (typeof hooks.validateFixtures === "function") {
    await hooks.validateFixtures({ config, manifests });
  }
};
