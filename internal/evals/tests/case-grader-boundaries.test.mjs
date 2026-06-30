import { describe, expect, it } from "vitest";

import { gradeBoundaries } from "../src/lib/case_grader.mjs";

const expectedBoundaries = {
  case_id: "case-tiny-laundry-pickup-v1",
  contexts: [
    {
      id: "CTX-001",
      name: "Identity",
      source_refs: ["SRC-001"],
      owns: ["verified resident record", "access checks"],
      reads: [],
      does_not_own: ["scheduling conflict logic"],
      must_include_all: ["Identity owns verified resident", "access checks"],
      must_not_include_any: ["Identity owns scheduling conflict"],
      accepted_alternatives: [
        {
          label: "Resident Eligibility owns verified resident fact",
          must_include_all: [
            "Resident Eligibility",
            "owns the verified-resident fact",
          ],
        },
      ],
    },
  ],
};

describe("gradeBoundaries", () => {
  it("accepts source-equivalent boundary evidence with different context names", () => {
    const findings = gradeBoundaries(
      "Resident Eligibility owns the verified-resident fact consumed during booking creation.",
      expectedBoundaries,
    );

    expect(findings[0]).toMatchObject({
      id: "CTX-001",
      verdict: "covered",
    });
  });

  it("does not accept an alternative when ownership evidence is missing", () => {
    const findings = gradeBoundaries(
      "Resident Eligibility reads verified resident status during booking creation.",
      expectedBoundaries,
    );

    expect(findings[0]).toMatchObject({
      id: "CTX-001",
      verdict: "missing",
    });
  });

  it("keeps forbidden ownership evidence as a blocker", () => {
    const findings = gradeBoundaries(
      [
        "Resident Eligibility owns the verified-resident fact consumed during booking creation.",
        "Identity owns scheduling conflict logic.",
      ].join("\n"),
      expectedBoundaries,
    );

    expect(findings[0]).toMatchObject({
      id: "CTX-001",
      verdict: "contradicted",
    });
  });
});
