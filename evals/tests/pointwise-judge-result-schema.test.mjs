import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { loadConfig } from "@agentic-workflow-kit/eval-kit";

const __filename = fileURLToPath(import.meta.url);
const packageRoot = path.resolve(path.dirname(__filename), "..");
const configPath = path.join(packageRoot, "eval-kit.config.json");

const config = loadConfig(configPath);
const registry = config.schemaRegistry;

const baseResult = {
  case_id: "case-tiny-laundry-pickup-v1",
  model: "gpt-5.4",
  provider: "openai:codex-app-server",
  rubric_version: "pointwise-coverage-rubric-v1",
  prompt_version: "pointwise-prompt-v1",
  items: [
    {
      item_id: "FACT-001",
      kind: "fact",
      verdict: "covered",
      severity: "critical",
      confidence: "high",
      candidate_evidence: [
        "States that the rider app reserves pickup windows.",
      ],
      source_refs: ["SRC-001"],
      explanation: "The candidate preserves the required workflow fact.",
    },
    {
      item_id: "CTX-001",
      kind: "boundary",
      verdict: "missing",
      severity: "recommended",
      confidence: "high",
      candidate_evidence: [],
      source_refs: ["SRC-002"],
      explanation: "The candidate misses the laundry pickup boundary seam.",
    },
  ],
};

describe("pointwise judge result schema", () => {
  it("allows valid pointwise judge results", () => {
    expect(() =>
      registry.validateWithSchema(
        "pointwise-judge-result.schema.json",
        baseResult,
        "result",
      ),
    ).not.toThrow();
  });

  it("fails when kind is invalid", () => {
    const invalid = {
      ...baseResult,
      items: [
        {
          ...baseResult.items[0],
          kind: "invented",
        },
      ],
    };

    expect(() =>
      registry.validateWithSchema(
        "pointwise-judge-result.schema.json",
        invalid,
        "result",
      ),
    ).toThrow();
  });

  it("fails when verdict is invalid for facts", () => {
    const invalid = {
      ...baseResult,
      items: [
        {
          ...baseResult.items[0],
          verdict: "no_idea",
        },
      ],
    };

    expect(() =>
      registry.validateWithSchema(
        "pointwise-judge-result.schema.json",
        invalid,
        "result",
      ),
    ).toThrow();
  });
});
