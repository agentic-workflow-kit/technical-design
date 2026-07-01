export const aggregateVerdict = (findings, policy) => {
  const blockingSeverities = new Set(policy.blocking_severities ?? []);
  const blockingVerdicts = new Set(policy.blocking_verdicts ?? []);
  const nonGreenVerdicts = new Set(policy.non_green_verdicts ?? []);
  const yellowVerdict = policy.yellow_verdict ?? "yellow";
  const redVerdict = policy.red_verdict ?? "red";
  const greenVerdict = policy.green_verdict ?? "green";

  if (
    findings.some(
      (finding) =>
        blockingSeverities.has(finding.severity) &&
        blockingVerdicts.has(finding.verdict),
    )
  ) {
    return redVerdict;
  }
  if (findings.some((finding) => nonGreenVerdicts.has(finding.verdict))) {
    return yellowVerdict;
  }
  return greenVerdict;
};

export const criticalBlockerCount = (findings, policy) => {
  const blockingSeverities = new Set(policy.blocking_severities ?? []);
  const blockingVerdicts = new Set(policy.blocking_verdicts ?? []);
  return findings.filter(
    (finding) =>
      blockingSeverities.has(finding.severity) &&
      blockingVerdicts.has(finding.verdict),
  ).length;
};
