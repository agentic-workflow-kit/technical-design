import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { createSchemaRegistry } from "../src/index.mjs";

const writeJson = (filePath, value) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
};

describe("eval-kit schema registry", () => {
  it("fails on duplicate schema ids", () => {
    const rootA = fs.mkdtempSync(path.join(os.tmpdir(), "eval-kit-schema-a-"));
    const rootB = fs.mkdtempSync(path.join(os.tmpdir(), "eval-kit-schema-b-"));
    const schema = {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: "https://example.test/duplicate.schema.json",
      type: "object",
    };
    writeJson(path.join(rootA, "a.schema.json"), schema);
    writeJson(path.join(rootB, "b.schema.json"), schema);

    expect(() => createSchemaRegistry({ schemaRoots: [rootA, rootB] })).toThrow(
      /duplicate schema/,
    );
  });

  it("validates result manifests with portable schemas", () => {
    const registry = createSchemaRegistry({
      schemaRoots: [path.resolve(import.meta.dirname, "../schemas")],
    });
    expect(() =>
      registry.validateWithSchema(
        "result-manifest.v2.schema.json",
        {
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
          artifacts: [],
          output_files: [],
        },
        "manifest",
      ),
    ).not.toThrow();
  });

  it("accepts current model-run metadata fields", () => {
    const registry = createSchemaRegistry({
      schemaRoots: [path.resolve(import.meta.dirname, "../schemas")],
    });
    expect(() =>
      registry.validateWithSchema(
        "result-manifest.v2.schema.json",
        {
          schema_version: "eval-kit.result-manifest.v2",
          run_id: "run-001",
          run_type: "generation",
          runner: { id: "generate", version: "0.0.0" },
          case_ids: ["case-a"],
          started_at: "2026-07-01T00:00:00.000Z",
          ended_at: "2026-07-01T00:00:01.000Z",
          duration_ms: 1000,
          status: "completed",
          git: { commit: "abc123" },
          command: "pnpm eval",
          tool_versions: { node: "v26.4.0" },
          artifacts: [],
          output_files: ["manifest.json"],
          model: "gpt-5.4",
          provider: "openai:codex-app-server",
          model_provider: "openai:codex-app-server:gpt-5.4",
          reasoning_effort: "medium",
          sandbox_mode: "read-only",
          approval_policy: "never",
          codex_auth_mode: "chatgpt-local",
          prompt_version: "generation-prompt-v1",
        },
        "manifest",
      ),
    ).not.toThrow();
  });
  it("validates pointwise judge results", () => {
    const registry = createSchemaRegistry({
      schemaRoots: [path.resolve(import.meta.dirname, "../schemas")],
    });
    expect(() =>
      registry.validateWithSchema(
        "pointwise-judge-result.schema.json",
        {
          case_id: "case-a",
          model: "gpt-5.4",
          provider: "openai:codex-app-server",
          rubric_version: "v1",
          prompt_version: "v1",
          items: [{
            item_id: "FACT-001",
            kind: "fact",
            verdict: "covered",
            severity: "critical",
            confidence: "high",
            candidate_evidence: ["evidence"],
            source_refs: ["SRC-001"],
            explanation: "explain"
          }]
        },
        "result",
      )
    ).not.toThrow();
  });
});
