import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { packageRoot } from "../src/lib/paths.mjs";
import { gradeBoundaries, gradeFacts } from "../src/lib/case_grader.mjs";

const casePath = (...parts) =>
  path.join(packageRoot, "fixtures", "cases", ...parts);

const readJson = (...parts) => JSON.parse(fs.readFileSync(casePath(...parts)));

const readText = (...parts) => fs.readFileSync(casePath(...parts), "utf8");

const verdictFor = (findings, id) =>
  findings.find((finding) => finding.id === id)?.verdict;

describe("public reference cases", () => {
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

  it("accepts notification delivery negative ownership wording for laundry", () => {
    const expectedBoundaries = readJson(
      "case-tiny-laundry-pickup-v1",
      "expected-boundaries.json",
    );

    const findings = gradeBoundaries(
      [
        "Notification Delivery owns delivery of lifecycle notifications.",
        "Notification Delivery does not own Booking state decisions.",
      ].join("\n"),
      expectedBoundaries,
    );

    expect(verdictFor(findings, "CTX-004")).toBe("covered");
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
});
