import { describe, expect, it } from "vitest";

import { validateJsonWithSchema } from "../src/lib/json.mjs";

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
      validateJsonWithSchema(
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
      validateJsonWithSchema(
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
      validateJsonWithSchema(
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
});
