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
      required_concepts: [
        {
          label: "resident verification owner",
          any_of: ["Resident Verification", "Resident Eligibility"],
        },
        {
          label: "verified resident fact",
          any_of: [
            "owns whether a resident is verified",
            "verified/not-verified resident status",
            "verified-resident fact",
          ],
        },
        {
          label: "scheduling does not own verification lifecycle",
          any_of: [
            "does not own verification lifecycle",
            "does not own resident verification policy",
          ],
        },
      ],
    },
    {
      id: "CTX-002",
      name: "Catalog",
      source_refs: ["SRC-006", "SRC-008", "SRC-011"],
      owns: ["appliance metadata", "maintenance hold inputs"],
      reads: [],
      does_not_own: ["booking lifecycle"],
      must_include_all: ["Catalog owns appliance", "maintenance hold"],
      must_not_include_any: ["Catalog owns booking lifecycle"],
      accepted_alternatives: [
        {
          label: "Scheduling read surface with separate hold producer",
          must_include_all: [
            "Booking Scheduling",
            "owns appliance read surface",
            "Maintenance Administration or Hold Producer",
            "Creation and lifecycle of maintenance holds",
          ],
        },
      ],
      required_concepts: [
        {
          label: "appliance owner",
          any_of: ["Laundry Scheduling", "Booking Scheduling", "Catalog"],
        },
        {
          label: "appliance type vocabulary",
          any_of: ["appliance types", "washer", "dryer"],
        },
        {
          label: "maintenance hold ownership",
          any_of: ["maintenance holds", "maintenance-hold"],
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

  it("accepts source-equivalent split boundary evidence", () => {
    const findings = gradeBoundaries(
      [
        "Booking Scheduling owns appliance read surface for v1.",
        "Maintenance Administration or Hold Producer owns Creation and lifecycle of maintenance holds at the source.",
      ].join("\n"),
      expectedBoundaries,
    );

    expect(findings[1]).toMatchObject({
      id: "CTX-002",
      verdict: "covered",
    });
  });

  it("accepts source-equivalent concept groups independent of context name", () => {
    const findings = gradeBoundaries(
      [
        "Laundry Scheduling owns appliances in v1 scope and appliance types.",
        "Maintenance holds are authoritative scheduling data inside the service boundary.",
      ].join("\n"),
      expectedBoundaries,
    );

    expect(findings[1]).toMatchObject({
      id: "CTX-002",
      verdict: "covered",
    });
  });

  it("accepts verified-resident ownership expressed as a fact question", () => {
    const findings = gradeBoundaries(
      [
        "Resident Verification owns whether a resident is verified.",
        "Scheduling consumes that fact but does not own verification lifecycle.",
      ].join("\n"),
      expectedBoundaries,
    );

    expect(findings[0]).toMatchObject({
      id: "CTX-001",
      verdict: "covered",
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

  it("does not accept scattered context and owns nouns without local ownership evidence", () => {
    const findings = gradeBoundaries(
      [
        "Identity participates in resident access flows.",
        "The glossary mentions verified resident records and access checks.",
        "Scheduling owns booking lifecycle and conflict checks.",
      ].join("\n"),
      expectedBoundaries,
    );

    expect(findings[0]).toMatchObject({
      id: "CTX-001",
      verdict: "missing",
      evidence: expect.stringContaining("missing required evidence"),
    });
  });

  it("accepts ownership evidence in a parent bullet with child bullets", () => {
    const findings = gradeBoundaries(
      [
        "- Identity owns:",
        "  - verified resident record",
        "  - access checks",
        "",
        "- Scheduling owns booking lifecycle and conflict checks.",
      ].join("\n"),
      expectedBoundaries,
    );

    expect(findings[0]).toMatchObject({
      id: "CTX-001",
      verdict: "covered",
    });
  });

  it("accepts ownership evidence in a sentence followed by plain child bullets", () => {
    const findings = gradeBoundaries(
      [
        "Identity owns resident eligibility:",
        "- verified resident record",
        "- access checks",
        "- Scheduling owns booking lifecycle and conflict checks.",
      ].join("\n"),
      expectedBoundaries,
    );

    expect(findings[0]).toMatchObject({
      id: "CTX-001",
      verdict: "covered",
    });
  });
});
