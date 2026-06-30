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
