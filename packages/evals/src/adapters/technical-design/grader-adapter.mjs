import {
  aggregateVerdict,
  criticalBlockerCount as countPolicyBlockers,
} from "@agentic-workflow-kit/eval-kit";

import { gradeBoundaries, gradeFacts } from "../../lib/case_grader.mjs";

export const deterministicVerdictPolicy = {
  blocking_severities: ["critical"],
  blocking_verdicts: ["missing", "contradicted", "invented"],
  non_green_verdicts: ["missing", "contradicted", "invented", "unknown"],
  red_verdict: "red",
  yellow_verdict: "yellow",
  green_verdict: "green",
};

export const gradeTechnicalDesignCandidate = ({
  candidateText,
  expectedFacts,
  expectedBoundaries,
}) => {
  const findings = [
    ...gradeFacts(candidateText, expectedFacts),
    ...gradeBoundaries(candidateText, expectedBoundaries),
  ];
  return {
    findings,
    verdict: aggregateVerdict(findings, deterministicVerdictPolicy),
  };
};

export const criticalBlockerCount = (findings) =>
  countPolicyBlockers(findings, deterministicVerdictPolicy);
