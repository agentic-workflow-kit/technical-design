import { describe, expect, it } from "vitest";

import { validateJsonWithSchema } from "../src/lib/json.mjs";

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
      verdict: "unknown",
      severity: "recommended",
      confidence: "low",
      candidate_evidence: [],
      source_refs: ["SRC-002"],
      explanation: "The candidate does not clearly name a context owner.",
    },
  ],
};

describe("pointwise judge result schema", () => {
  it("accepts a valid pointwise result payload", () => {
    expect(() =>
      validateJsonWithSchema(
        "pointwise-judge-result.schema.json",
        baseResult,
        "pointwise judge result",
      ),
    ).not.toThrow();
  });

  it.each(["covered", "partial", "contradicted"])(
    "rejects %s items without candidate evidence",
    (verdict) => {
      expect(() =>
        validateJsonWithSchema(
          "pointwise-judge-result.schema.json",
          {
            ...baseResult,
            items: [
              {
                ...baseResult.items[0],
                verdict,
                candidate_evidence: [],
              },
            ],
          },
          "pointwise judge result",
        ),
      ).toThrow(/candidate_evidence/);
    },
  );
});
