import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { loadConfig } from "@agentic-workflow-kit/eval-kit";

const __filename = fileURLToPath(import.meta.url);
const packageRoot = path.resolve(path.dirname(__filename), "..");
const configPath = path.join(packageRoot, "eval-kit.config.json");

const config = loadConfig(configPath);
const registry = config.schemaRegistry;

const baseManifest = {
  run_id: "pilot-001",
  git_commit: "abc123",
  command: "pnpm eval",
  case_ids: ["case-tiny-laundry-pickup-v1"],
  tool_versions: {
    node: "v22.22.1",
  },
  output_files: ["manifest.json"],
};

describe("results manifest schema", () => {
  it("allows deterministic manifests without model metadata", () => {
    expect(() =>
      registry.validateWithSchema(
        "results-manifest.schema.json",
        {
          ...baseManifest,
          run_type: "deterministic",
        },
        "manifest",
      ),
    ).not.toThrow();
  });

  it("requires model metadata for generation manifests", () => {
    expect(() =>
      registry.validateWithSchema(
        "results-manifest.schema.json",
        {
          ...baseManifest,
          run_type: "generation",
        },
        "manifest",
      ),
    ).toThrow(/model/);
  });

  it("requires randomization metadata for judge manifests", () => {
    expect(() =>
      registry.validateWithSchema(
        "results-manifest.schema.json",
        {
          ...baseManifest,
          run_type: "judge",
          model: "gpt-5.4",
          provider: "openai:codex-app-server",
          prompt_version: "pairwise-prompt-v1",
          rubric_version: "judge-rubric-v1",
        },
        "manifest",
      ),
    ).toThrow(/randomization/);
  });

  it("accepts pointwise judge coverage manifests without randomization", () => {
    expect(() =>
      registry.validateWithSchema(
        "results-manifest.schema.json",
        {
          ...baseManifest,
          run_type: "judge-coverage",
          model: "gpt-5.4",
          provider: "openai:codex-app-server",
          prompt_version: "pointwise-prompt-v1",
          rubric_version: "pointwise-coverage-rubric-v1",
        },
        "manifest",
      ),
    ).not.toThrow();
  });
});
