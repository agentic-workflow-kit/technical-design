import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { fileURLToPath } from "node:url";
import { gradeFacts } from "@agentic-workflow-kit/eval-kit";
import { gradeBoundaries, verdictForFindings } from "../hooks.mjs";

const __filename = fileURLToPath(import.meta.url);
const packageRoot = path.resolve(path.dirname(__filename), "..");

const casePath = (...parts) =>
  path.join(packageRoot, "fixtures", "cases", ...parts);

const readJson = (...parts) => JSON.parse(fs.readFileSync(casePath(...parts)));

const readText = (...parts) => fs.readFileSync(casePath(...parts), "utf8");

const verdictFor = (findings, id) =>
  findings.find((finding) => finding.id === id)?.verdict;

const findingsForCaseCandidate = (caseId, candidate) => [
  ...gradeFacts(candidate, readJson(caseId, "expected-facts.json")),
  ...gradeBoundaries(candidate, readJson(caseId, "expected-boundaries.json")),
];

const newPublicCaseIds = [
  "case-cloudevents-core-contract-v1",
  "case-openfeature-evaluation-api-v1",
  "case-kubernetes-sidecar-containers-v1",
  "case-fineract-loan-lifecycle-v1",
];

describe("public reference cases", () => {
  it("accepts the new public reference designs", () => {
    for (const caseId of newPublicCaseIds) {
      const findings = findingsForCaseCandidate(
        caseId,
        readText(caseId, "reference-design.md"),
      );

      expect(verdictForFindings(findings), caseId).toBe("green");
    }
  });

  it("rejects 2PC as a customer-credit saga contradiction", () => {
    const expectedFacts = readJson(
      "case-customer-credit-order-saga-v1",
      "expected-facts.json",
    );
    const expectedBoundaries = readJson(
      "case-customer-credit-order-saga-v1",
      "expected-boundaries.json",
    );
    const badCandidate = [
      "Messaging and Integration Infrastructure carries commands and asynchronous replies.",
      "CDC publishes persisted messages to Kafka.",
      "The design uses 2PC for consistency between Order Service and Customer Service.",
    ].join("\n");

    const factFindings = gradeFacts(badCandidate, expectedFacts);
    const boundaryFindings = gradeBoundaries(badCandidate, expectedBoundaries);

    expect(verdictFor(factFindings, "FACT-008")).toBe("contradicted");
    expect(verdictFor(boundaryFindings, "CTX-003")).toBe("contradicted");
  });

  it("requires the aerial delivery facts conjunctively", () => {
    const expectedFacts = readJson(
      "case-aerial-delivery-shipping-v1",
      "expected-facts.json",
    );

    const findings = gradeFacts(
      [
        "Businesses register with the service.",
        "Scheduler coordinates the workflow.",
        "The system gives users an ETA.",
      ].join("\n"),
      expectedFacts,
    );

    expect(verdictFor(findings, "FACT-001")).toBe("missing");
    expect(verdictFor(findings, "FACT-002")).toBe("missing");
    expect(verdictFor(findings, "FACT-003")).toBe("missing");
  });

  it("rejects invented billing, pricing, payment, or rewards scope for laundry", () => {
    const expectedFacts = readJson(
      "case-tiny-laundry-pickup-v1",
      "expected-facts.json",
    );

    const findings = gradeFacts(
      "Billing is in scope, Dynamic Pricing owns surge prices, and PaymentGateway handles rewards.",
      expectedFacts,
    );

    expect(verdictFor(findings, "FACT-007")).toBe("contradicted");
  });

  it("accepts source-native customer saga wording for service names and persistence", () => {
    const expectedFacts = readJson(
      "case-customer-credit-order-saga-v1",
      "expected-facts.json",
    );

    const findings = gradeFacts(
      [
        "The implementation example has two services: `Order Service` creates orders and `Customer Service` manages customers.",
        "`Customer Service` owns customer records, credit limit, available-credit calculation, and per-order credit reservations.",
        "Each service keeps its own database, so `Customer Service` and `Order Service` persist their own data.",
      ].join("\n"),
      expectedFacts,
    );

    expect(verdictFor(findings, "FACT-001")).toBe("covered");
    expect(verdictFor(findings, "FACT-003")).toBe("covered");
    expect(verdictFor(findings, "FACT-007")).toBe("covered");
  });

  it("accepts source-native Customer Service wording for reserve-credit flow", () => {
    const expectedFacts = readJson(
      "case-customer-credit-order-saga-v1",
      "expected-facts.json",
    );

    const findings = gradeFacts(
      "Order Service sends reserveCredit to Customer Service and waits for the reply outcome.",
      expectedFacts,
    );

    expect(verdictFor(findings, "FACT-005")).toBe("covered");
  });

  it("requires reply or outcome evidence for customer saga reserve-credit flow", () => {
    const expectedFacts = readJson(
      "case-customer-credit-order-saga-v1",
      "expected-facts.json",
    );

    const findings = gradeFacts(
      "Order Service sends reserveCredit to Customer Service.",
      expectedFacts,
    );

    expect(verdictFor(findings, "FACT-005")).toBe("missing");
  });

  it("requires customer saga persistence to cover both owning services", () => {
    const expectedFacts = readJson(
      "case-customer-credit-order-saga-v1",
      "expected-facts.json",
    );

    const customerOnly = gradeFacts(
      "Customer Service updates its own database.",
      expectedFacts,
    );
    const orderOnly = gradeFacts(
      "Order Service updates its own database.",
      expectedFacts,
    );
    const customerExactBypass = gradeFacts(
      "This follows the local-transaction saga approach. Customer Service persists its own data.",
      expectedFacts,
    );
    const orderExactBypass = gradeFacts(
      "Order Service uses its own database to persist its own data.",
      expectedFacts,
    );
    const pluralVerbBothServices = gradeFacts(
      "Order Service and Customer Service persist their own data rather than sharing a database transaction.",
      expectedFacts,
    );

    expect(verdictFor(customerOnly, "FACT-007")).toBe("missing");
    expect(verdictFor(orderOnly, "FACT-007")).toBe("missing");
    expect(verdictFor(customerExactBypass, "FACT-007")).toBe("missing");
    expect(verdictFor(orderExactBypass, "FACT-007")).toBe("missing");
    expect(verdictFor(pluralVerbBothServices, "FACT-007")).toBe("covered");
  });

  it("accepts negated customer saga shared-transaction wording", () => {
    const expectedFacts = readJson(
      "case-customer-credit-order-saga-v1",
      "expected-facts.json",
    );

    const findings = gradeFacts(
      [
        "A shared database transaction, distributed transaction, and 2PC contradict the local-transaction saga approach.",
        "Customer Service and Order Service do not share one database transaction.",
      ].join("\n"),
      expectedFacts,
    );

    expect(verdictFor(findings, "FACT-008")).toBe("covered");
  });

  it("accepts negated laundry multiple-booking wording", () => {
    const expectedFacts = readJson(
      "case-tiny-laundry-pickup-v1",
      "expected-facts.json",
    );

    const findings = gradeFacts(
      "Scheduling does not allow multiple active bookings per resident; each resident has at most one active booking.",
      expectedFacts,
    );

    expect(verdictFor(findings, "FACT-002")).toBe("covered");
  });

  it("accepts aerial pickup requests using the source-native plural wording", () => {
    const expectedFacts = readJson(
      "case-aerial-delivery-shipping-v1",
      "expected-facts.json",
    );

    const findings = gradeFacts(
      "Businesses register with the service and users request pickups for delivery.",
      expectedFacts,
    );

    expect(verdictFor(findings, "FACT-001")).toBe("covered");
  });

  it("accepts aerial non-goals when they are visible in generation inputs", () => {
    const expectedFacts = readJson(
      "case-aerial-delivery-shipping-v1",
      "expected-facts.json",
    );

    const findings = gradeFacts(
      "Detailed account internals, drone regulatory workflows, exact public APIs, and production flight-safety policies remain out of scope for this fixture.",
      expectedFacts,
    );

    expect(verdictFor(findings, "FACT-007")).toBe("covered");
  });

  it("accepts singular aerial regulatory non-goal wording", () => {
    const expectedFacts = readJson(
      "case-aerial-delivery-shipping-v1",
      "expected-facts.json",
    );

    const findings = gradeFacts(
      "Detailed account internals, drone regulatory workflow, exact public APIs, and production flight-safety policies remain out of scope.",
      expectedFacts,
    );

    expect(verdictFor(findings, "FACT-007")).toBe("covered");
  });

  it("accepts source-backed package boundary wording for aerial delivery", () => {
    const expectedBoundaries = readJson(
      "case-aerial-delivery-shipping-v1",
      "expected-boundaries.json",
    );

    const findings = gradeBoundaries(
      "Package is a separate aggregate and direct microservice candidate responsible for package tagging and package metadata.",
      expectedBoundaries,
    );

    expect(verdictFor(findings, "CTX-004")).toBe("covered");
  });

  it("accepts package as an internal Shipping sub-boundary for aerial delivery", () => {
    const expectedBoundaries = readJson(
      "case-aerial-delivery-shipping-v1",
      "expected-boundaries.json",
    );

    const findings = gradeBoundaries(
      "Shipping keeps Package as an internal sub-boundary for package tagging.",
      expectedBoundaries,
    );

    expect(verdictFor(findings, "CTX-004")).toBe("covered");
  });

  it("rejects Ingestion owning scheduling decisions for aerial delivery", () => {
    const expectedFacts = readJson(
      "case-aerial-delivery-shipping-v1",
      "expected-facts.json",
    );

    const findings = gradeFacts(
      "Ingestion decides which drone gets assigned after buffering pickup requests.",
      expectedFacts,
    );

    expect(verdictFor(findings, "FACT-008")).toBe("contradicted");
  });

  it("rejects Identity owning laundry scheduling conflict logic", () => {
    const expectedFacts = readJson(
      "case-tiny-laundry-pickup-v1",
      "expected-facts.json",
    );
    const expectedBoundaries = readJson(
      "case-tiny-laundry-pickup-v1",
      "expected-boundaries.json",
    );
    const candidate = [
      readText("case-tiny-laundry-pickup-v1", "reference-design.md"),
      "Identity owns scheduling conflict logic.",
    ].join("\n\n");

    const findings = [
      ...gradeFacts(candidate, expectedFacts),
      ...gradeBoundaries(candidate, expectedBoundaries),
    ];

    expect(verdictFor(findings, "FACT-011")).toBe("contradicted");
    expect(verdictForFindings(findings)).toBe("red");
  });

  it("does not assert unsupported drone telemetry ownership", () => {
    const expectedBoundaries = readText(
      "case-aerial-delivery-shipping-v1",
      "expected-boundaries.json",
    );
    const referenceDesign = readText(
      "case-aerial-delivery-shipping-v1",
      "reference-design.md",
    );

    expect(expectedBoundaries).not.toMatch(/fleet status|drone telemetry/i);
    expect(referenceDesign).not.toMatch(/fleet status|drone telemetry/i);
  });

  it("rejects documented aerial delivery deterministic blocker snippets", () => {
    const caseId = "case-aerial-delivery-shipping-v1";
    const referenceDesign = readText(caseId, "reference-design.md");

    const snippets = [
      ["Delivery owns long-term delivery history", "CTX-005"],
      ["Ingestion owns scheduling decisions", "FACT-008"],
      ["Accounts owns delivery scheduling", "CTX-003"],
      ["Drone Management owns delivery history", "CTX-002"],
      ["Shipping owns drone fleet policy", "CTX-001"],
      [
        "Telemetry owns fleet status and drone regulatory workflow for this fixture",
        "FACT-007",
      ],
    ];

    for (const [snippet, expectedFindingId] of snippets) {
      const findings = findingsForCaseCandidate(
        caseId,
        [referenceDesign, snippet].join("\n\n"),
      );

      expect(verdictFor(findings, expectedFindingId), snippet).toBe(
        "contradicted",
      );
      expect(verdictForFindings(findings), snippet).toBe("red");
    }
  });

  it("rejects documented customer-credit saga deterministic blocker snippets", () => {
    const caseId = "case-customer-credit-order-saga-v1";
    const referenceDesign = readText(caseId, "reference-design.md");

    const snippets = [
      ["Customer Credit owns order rejection reason", "CTX-002"],
      ["Messaging and Integration Infrastructure owns order state", "CTX-003"],
      ["Messaging owns credit policy", "CTX-003"],
      [
        "The design uses 2PC for consistency between Order Service and Customer Service",
        "FACT-008",
      ],
      [
        "Customer Service and Order Service share one database transaction",
        "FACT-008",
      ],
    ];

    for (const [snippet, expectedFindingId] of snippets) {
      const findings = findingsForCaseCandidate(
        caseId,
        [referenceDesign, snippet].join("\n\n"),
      );

      expect(verdictFor(findings, expectedFindingId), snippet).toBe(
        "contradicted",
      );
      expect(verdictForFindings(findings), snippet).toBe("red");
    }
  });

  it("rejects documented laundry deterministic blocker snippets", () => {
    const caseId = "case-tiny-laundry-pickup-v1";
    const referenceDesign = readText(caseId, "reference-design.md");

    const snippets = [
      ["Billing owns laundry payment collection", "FACT-007"],
      ["Dynamic Pricing owns washer surge prices", "FACT-007"],
      ["Identity owns scheduling conflict logic", "FACT-011"],
      ["Residents may keep multiple active bookings", "FACT-002"],
      ["Notification Delivery owns Booking state transitions", "FACT-003"],
    ];

    for (const [snippet, expectedFindingId] of snippets) {
      const findings = findingsForCaseCandidate(
        caseId,
        [referenceDesign, snippet].join("\n\n"),
      );

      expect(verdictFor(findings, expectedFindingId), snippet).toBe(
        "contradicted",
      );
      expect(verdictForFindings(findings), snippet).toBe("red");
    }
  });

  it("rejects documented CloudEvents deterministic blocker snippets", () => {
    const caseId = "case-cloudevents-core-contract-v1";
    const referenceDesign = readText(caseId, "reference-design.md");

    const snippets = [
      ["Kafka owns CloudEvents delivery", "FACT-005"],
      ["CloudEvents defines event-sourcing lifecycle", "FACT-005"],
      ["context attributes and domain payload are one object", "FACT-002"],
      ["Event Contract owns domain payload lifecycle", "CTX-001"],
    ];

    for (const [snippet, expectedFindingId] of snippets) {
      const findings = findingsForCaseCandidate(
        caseId,
        [referenceDesign, snippet].join("\n\n"),
      );

      expect(verdictFor(findings, expectedFindingId), snippet).toBe(
        "contradicted",
      );
      expect(verdictForFindings(findings), snippet).toBe("red");
    }
  });

  it("rejects documented OpenFeature deterministic blocker snippets", () => {
    const caseId = "case-openfeature-evaluation-api-v1";
    const referenceDesign = readText(caseId, "reference-design.md");

    const snippets = [
      ["OpenFeature owns flag management UI", "FACT-006"],
      ["requires a FeatureFlag aggregate", "FACT-006"],
      ["Use a FeatureFlag aggregate for this design", "FACT-006"],
      ["FeatureFlag aggregate is the core model", "FACT-006"],
      ["Provider owns application business logic", "FACT-003"],
      ["OpenFeature owns audit workflow", "FACT-006"],
    ];

    for (const [snippet, expectedFindingId] of snippets) {
      const findings = findingsForCaseCandidate(
        caseId,
        [referenceDesign, snippet].join("\n\n"),
      );

      expect(verdictFor(findings, expectedFindingId), snippet).toBe(
        "contradicted",
      );
      expect(verdictForFindings(findings), snippet).toBe("red");
    }
  });

  it("rejects documented Kubernetes sidecar deterministic blocker snippets", () => {
    const caseId = "case-kubernetes-sidecar-containers-v1";
    const referenceDesign = readText(caseId, "reference-design.md");

    const snippets = [
      ["sidecars are ordinary app containers", "FACT-001"],
      ["sidecars must finish before pod termination", "FACT-004"],
      ["sidecars terminate before main containers", "FACT-004"],
      ["SidecarWorkload API", "FACT-007"],
      ["Use a new workload API for sidecars", "FACT-007"],
    ];

    for (const [snippet, expectedFindingId] of snippets) {
      const findings = findingsForCaseCandidate(
        caseId,
        [referenceDesign, snippet].join("\n\n"),
      );

      expect(verdictFor(findings, expectedFindingId), snippet).toBe(
        "contradicted",
      );
      expect(verdictForFindings(findings), snippet).toBe("red");
    }
  });

  it("rejects documented Fineract deterministic blocker snippets", () => {
    const caseId = "case-fineract-loan-lifecycle-v1";
    const referenceDesign = readText(caseId, "reference-design.md");

    const snippets = [
      ["charge mutation after approval is unrestricted", "FACT-005"],
      ["Loan Account Lifecycle owns product configuration", "CTX-001"],
      ["loan product and loan account are the same aggregate", "FACT-001"],
      ["Underwriting owns approval decision", "FACT-007"],
      ["business events are UI-only state", "FACT-006"],
    ];

    for (const [snippet, expectedFindingId] of snippets) {
      const findings = findingsForCaseCandidate(
        caseId,
        [referenceDesign, snippet].join("\n\n"),
      );

      expect(verdictFor(findings, expectedFindingId), snippet).toBe(
        "contradicted",
      );
      expect(verdictForFindings(findings), snippet).toBe("red");
    }
  });

  it("accepts valid negated and non-goal wording for new cases", () => {
    const validCandidates = [
      [
        "case-cloudevents-core-contract-v1",
        "Kafka and event-sourcing remain out of scope; context attributes stay separate from domain-specific payload event data, and JSON format support serializes events as bytes in structured mode and binary mode for interoperability across services, platforms, and systems.",
        "FACT-005",
      ],
      [
        "case-openfeature-evaluation-api-v1",
        "No FeatureFlag aggregate is required. Flag-management UI, rule authoring, audit workflow, and application business decisions remain out of scope while the evaluation API stays vendor-agnostic with no-op default behavior.",
        "FACT-006",
      ],
      [
        "case-kubernetes-sidecar-containers-v1",
        "No new workload API is selected; sidecars are not ordinary app containers. They are special init containers in initContainers with restartPolicy: Always and keep app containers distinct.",
        "FACT-007",
      ],
      [
        "case-fineract-loan-lifecycle-v1",
        "Underwriting, credit scoring, and client onboarding remain out of scope; Loan Account Lifecycle reads the loan product template but does not own loan product configuration.",
        "FACT-007",
      ],
    ];

    for (const [caseId, candidate, expectedFindingId] of validCandidates) {
      const findings = findingsForCaseCandidate(
        caseId,
        [readText(caseId, "reference-design.md"), candidate].join("\n\n"),
      );

      expect(verdictFor(findings, expectedFindingId), caseId).toBe("covered");
      expect(verdictForFindings(findings), caseId).toBe("green");
    }
  });
});
