import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

import { loadConfig } from "@agentic-workflow-kit/eval-kit";

const __filename = fileURLToPath(import.meta.url);
const packageRoot = path.resolve(path.dirname(__filename), "..");
const repoRoot = path.resolve(packageRoot, "../..");
const configPath = path.join(repoRoot, "evals", "eval-kit.config.json");

const config = loadConfig(configPath);
const resolver = config.pathResolver;

const sourceRunId = "unit-v2-source-run";
const reportRunId = "unit-v2-manual-report";

const removeRun = (runId) => {
  fs.rmSync(resolver.resolveRunDir(runId), { recursive: true, force: true });
};

const writeJson = (filePath, value) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
};

const writeText = (filePath, value) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
};

describe("manual report runner", () => {
  afterEach(() => {
    removeRun(sourceRunId);
    removeRun(reportRunId);
  });

  it("preserves source commit provenance from v2 manifests and writes v2 output", () => {
    removeRun(sourceRunId);
    removeRun(reportRunId);

    const sourceRunDir = resolver.resolveRunDir(sourceRunId);
    writeJson(path.join(sourceRunDir, "manifest.json"), {
      schema_version: "eval-kit.result-manifest.v2",
      run_id: sourceRunId,
      run_type: "deterministic",
      runner: {
        id: "unit-deterministic",
        version: "0.0.0",
      },
      case_ids: ["case-tiny-laundry-pickup-v1"],
      started_at: "2026-07-01T00:00:00.000Z",
      ended_at: "2026-07-01T00:00:01.000Z",
      duration_ms: 1000,
      status: "completed",
      git: {
        commit: "feedface1234",
      },
      command: "pnpm eval:case",
      tool_versions: {
        node: "v26.0.0",
      },
      artifacts: [
        {
          role: "report",
          path: "report.md",
          sha256:
            "0000000000000000000000000000000000000000000000000000000000000000",
          size_bytes: 14,
          media_type: "text/markdown",
          encoding: "utf-8",
          redaction_status: "public-safe",
        },
      ],
      output_files: ["manifest.json", "grades.json", "report.md"],
    });
    writeJson(path.join(sourceRunDir, "grades.json"), {
      case_id: "case-tiny-laundry-pickup-v1",
      verdict: "green",
      findings: [],
    });
    writeText(path.join(sourceRunDir, "report.md"), "Verdict: green\n");

    execFileSync(
      process.execPath,
      [
        path.resolve(repoRoot, "packages/eval-kit/bin/eval-kit.mjs"),
        "report",
        "--run-id",
        reportRunId,
        "--deterministic",
        sourceRunId,
        "--config",
        configPath,
      ],
      {
        cwd: packageRoot,
        stdio: "pipe",
      },
    );

    const reportRunDir = resolver.resolveRunDir(reportRunId);
    const report = fs.readFileSync(
      path.join(reportRunDir, "report.md"),
      "utf8",
    );
    const manifest = JSON.parse(
      fs.readFileSync(path.join(reportRunDir, "manifest.json"), "utf8"),
    );

    expect(report).toContain("Deterministic Run results");
    expect(report).toContain("Verdict: green");
    expect(manifest.schema_version).toBe("eval-kit.result-manifest.v2");
    expect(manifest.run_type).toBe("manual-report");
    expect(manifest.git.commit).toMatch(/\S/);
    expect(manifest.output_files).toEqual([
      "manifest.json",
      "report.md",
      "deterministic_grades.json",
    ]);
    expect(manifest.artifacts).toEqual([
      expect.objectContaining({
        role: "report",
        path: "report.md",
        sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
        media_type: "text/markdown",
        redaction_status: "public-safe",
      }),
      expect.objectContaining({
        role: "deterministic_grades",
        path: "deterministic_grades.json",
        sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
        media_type: "application/json",
        redaction_status: "public-safe",
      }),
    ]);
  });
});
