import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  artifactRecord,
  normalizeLegacyManifest,
  sha256File,
  writeManifest,
} from "../src/index.mjs";

describe("eval-kit artifacts", () => {
  it("records artifact metadata and rejects escapes", () => {
    const runDir = fs.mkdtempSync(path.join(os.tmpdir(), "eval-kit-run-"));
    fs.writeFileSync(path.join(runDir, "report.md"), "# Report\n");

    const artifact = artifactRecord({
      role: "report",
      path: "report.md",
      runDir,
      mediaType: "text/markdown",
    });

    expect(artifact.sha256).toBe(sha256File(path.join(runDir, "report.md")));
    expect(artifact.size_bytes).toBeGreaterThan(0);
    expect(() =>
      artifactRecord({
        role: "report",
        path: "../report.md",
        runDir,
        mediaType: "text/markdown",
      }),
    ).toThrow(/escapes/);
  });

  it("normalizes legacy output_files manifests", () => {
    const runDir = fs.mkdtempSync(path.join(os.tmpdir(), "eval-kit-legacy-"));
    fs.writeFileSync(path.join(runDir, "manifest.json"), "{}\n");
    const normalized = normalizeLegacyManifest(
      {
        run_id: "legacy-run",
        run_type: "deterministic",
        git_commit: "abc123",
        command: "pnpm eval",
        case_ids: ["case-a"],
        tool_versions: { node: "v26.4.0" },
        output_files: ["manifest.json", "missing.md"],
      },
      runDir,
    );

    expect(normalized.schema_version).toBe("eval-kit.result-manifest.v2");
    expect(normalized.artifacts).toHaveLength(2);
    expect(normalized.artifacts[0].sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(normalized.artifacts[1].sha256).toBeNull();
  });

  it("defaults output_files to manifest plus artifact paths", () => {
    const runDir = fs.mkdtempSync(path.join(os.tmpdir(), "eval-kit-write-"));
    fs.writeFileSync(path.join(runDir, "report.md"), "# Report\n");
    const written = writeManifest({
      runDir,
      manifest: {
        schema_version: "eval-kit.result-manifest.v2",
        run_id: "run-001",
        run_type: "deterministic",
        runner: { id: "test", version: "0.0.0" },
        case_ids: ["case-a"],
        started_at: "2026-07-01T00:00:00.000Z",
        ended_at: "2026-07-01T00:00:01.000Z",
        duration_ms: 1000,
        status: "completed",
        git: { commit: "abc123" },
        command: "pnpm test",
        tool_versions: { node: "v26.4.0" },
        artifacts: [
          artifactRecord({
            role: "report",
            path: "report.md",
            runDir,
            mediaType: "text/markdown",
          }),
        ],
      },
    });

    expect(written.output_files).toEqual(["manifest.json", "report.md"]);
  });
});
