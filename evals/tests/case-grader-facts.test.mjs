import { describe, expect, it } from "vitest";

import { gradeFacts, normalize } from "@agentic-workflow-kit/eval-kit";
import { criticalBlockerCount } from "../adapter.mjs";

const expectedFacts = {
  case_id: "case-test",
  facts: [
    {
      id: "FACT-001",
      category: "workflow",
      severity: "critical",
      source_refs: ["SRC-001"],
      description: "Exact wording check",
      must_include_any: ["business enrollment"],
      must_include_all: ["users request pickup"],
    },
    {
      id: "FACT-002",
      category: "constraint",
      severity: "critical",
      source_refs: ["SRC-002"],
      description: "Accepted alternative check",
      must_include_any: ["Customer Credit owns"],
      must_include_all: ["customer data", "credit reservations"],
      accepted_alternatives: [
        {
          label: "Customer Service source wording",
          must_include_all: [
            "Customer Service",
            "customer records",
            "per-order credit reservations",
          ],
        },
      ],
    },
    {
      id: "FACT-003",
      category: "constraint",
      severity: "critical",
      source_refs: ["SRC-003"],
      description: "Concept group check",
      must_include_any: ["persist their own data"],
      required_concepts: [
        {
          label: "service-local persistence",
          any_of: ["own database", "persist their own data"],
        },
        {
          label: "order-side service",
          any_of: ["Order Service"],
        },
        {
          label: "customer-side service",
          any_of: ["Customer Service"],
        },
      ],
    },
    {
      id: "FACT-004",
      category: "non-goal",
      severity: "critical",
      source_refs: ["SRC-004"],
      description: "Forbidden contradiction check",
      must_include_any: ["out of scope"],
      must_not_include_any: ["uses 2PC"],
    },
  ],
};

describe("normalize", () => {
  it("strips markdown emphasis and normalizes punctuation", () => {
    expect(
      normalize(
        "`Customer Service` owns *per-order* reservations — and exact APIs.",
      ),
    ).toBe("customer service owns per order reservations and exact apis");
  });
});

describe("gradeFacts", () => {
  it("reports exact evidence hits", () => {
    const findings = gradeFacts(
      "Business enrollment is required and users request pickup from the service.",
      expectedFacts,
    );

    expect(findings[0]).toMatchObject({
      id: "FACT-001",
      verdict: "covered",
      evidence: expect.stringContaining("exact evidence hit"),
    });
  });

  it("reports accepted alternative hits", () => {
    const findings = gradeFacts(
      "Customer Service owns customer records and per-order credit reservations.",
      expectedFacts,
    );

    expect(findings[1]).toMatchObject({
      id: "FACT-002",
      verdict: "covered",
      evidence: "accepted alternative matched: Customer Service source wording",
    });
  });

  it("reports concept-group hits", () => {
    const findings = gradeFacts(
      "Each service keeps its own database: Order Service persists orders and Customer Service persists customers.",
      expectedFacts,
    );

    expect(findings[2]).toMatchObject({
      id: "FACT-003",
      verdict: "covered",
      evidence:
        "concept groups matched: service-local persistence, order-side service, customer-side service",
    });
  });

  it("keeps forbidden evidence as a contradiction", () => {
    const findings = gradeFacts(
      "The design is out of scope for now but still uses 2PC for consistency.",
      expectedFacts,
    );

    expect(findings[3]).toMatchObject({
      id: "FACT-004",
      verdict: "contradicted",
      evidence: 'forbidden evidence hit: "uses 2PC"',
    });
  });

  it("does not match short snippets inside longer tokens", () => {
    const findings = gradeFacts("Package metadata includes location.", {
      case_id: "case-test",
      facts: [
        {
          id: "FACT-ETA",
          category: "workflow",
          severity: "critical",
          source_refs: ["SRC-001"],
          description: "ETA must be explicit",
          must_include_any: ["ETA"],
        },
      ],
    });

    expect(findings[0]).toMatchObject({
      id: "FACT-ETA",
      verdict: "missing",
    });
  });

  it("matches short snippets as standalone tokens", () => {
    const findings = gradeFacts("Users can track location and ETA.", {
      case_id: "case-test",
      facts: [
        {
          id: "FACT-ETA",
          category: "workflow",
          severity: "critical",
          source_refs: ["SRC-001"],
          description: "ETA must be explicit",
          must_include_any: ["ETA"],
        },
      ],
    });

    expect(findings[0]).toMatchObject({
      id: "FACT-ETA",
      verdict: "covered",
    });
  });
});

describe("criticalBlockerCount", () => {
  it("counts only critical blocking verdicts", () => {
    expect(
      criticalBlockerCount([
        { severity: "recommended", verdict: "missing" },
        { severity: "critical", verdict: "missing" },
        { severity: "critical", verdict: "contradicted" },
        { severity: "critical", verdict: "covered" },
        { severity: "recommended", verdict: "invented" },
      ]),
    ).toBe(2);
  });
});
