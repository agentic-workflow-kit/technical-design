import { relativeToRepo } from "../../lib/paths.mjs";
import { criticalBlockerCount } from "./grader-adapter.mjs";

export const renderDeterministicReport = ({
  caseId,
  grades,
  findings,
  caseDir,
  candidatePath,
}) => {
  const blockerCount = criticalBlockerCount(findings);
  const findingCounts = findings.reduce(
    (counts, finding) => ({
      ...counts,
      [finding.verdict]: (counts[finding.verdict] ?? 0) + 1,
    }),
    {},
  );
  return [
    `# Eval Report: ${caseId}`,
    "",
    `Verdict: ${grades.verdict}`,
    `Blocker findings: ${blockerCount}`,
    `Finding counts: covered=${findingCounts.covered ?? 0}, missing=${findingCounts.missing ?? 0}, contradicted=${findingCounts.contradicted ?? 0}, invented=${findingCounts.invented ?? 0}, unknown=${findingCounts.unknown ?? 0}`,
    "",
    "## Findings",
    "",
    ...findings.map(
      (finding) =>
        `- ${finding.id} (${finding.kind}, ${finding.severity}): ${finding.verdict} - ${finding.evidence}`,
    ),
    "",
    `Case directory: ${relativeToRepo(caseDir)}`,
    `Candidate: ${relativeToRepo(candidatePath)}`,
  ].join("\n");
};
