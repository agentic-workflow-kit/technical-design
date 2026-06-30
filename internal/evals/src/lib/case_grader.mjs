export const normalize = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

export const includesAny = (text, snippets = []) =>
  snippets.some((snippet) => normalize(text).includes(normalize(snippet)));

export const includesAll = (text, snippets = []) =>
  snippets.every((snippet) => normalize(text).includes(normalize(snippet)));

export const gradeFacts = (candidateText, expectedFacts) =>
  expectedFacts.facts.map((fact) => {
    const forbiddenHit = includesAny(
      candidateText,
      fact.must_not_include_any ?? [],
    );
    const anyRequired = fact.must_include_any ?? [];
    const allRequired = fact.must_include_all ?? [];
    const requiredHit =
      (anyRequired.length === 0 || includesAny(candidateText, anyRequired)) &&
      includesAll(candidateText, allRequired);
    let verdict = "covered";
    let evidence = "required text evidence found";
    if (forbiddenHit) {
      verdict = "contradicted";
      evidence = "forbidden text evidence found";
    } else if (!requiredHit) {
      verdict = "missing";
      evidence = "no required text evidence found";
    }
    return {
      id: fact.id,
      kind: "fact",
      severity: fact.severity,
      verdict,
      evidence,
    };
  });

const acceptedAlternativeHit = (candidateText, alternatives = []) =>
  alternatives.some((alternative) => {
    const forbiddenHit = includesAny(
      candidateText,
      alternative.must_not_include_any ?? [],
    );
    return (
      !forbiddenHit &&
      includesAll(candidateText, alternative.must_include_all ?? [])
    );
  });

export const gradeBoundaries = (candidateText, expectedBoundaries) =>
  expectedBoundaries.contexts.map((context) => {
    const forbiddenHit = includesAny(
      candidateText,
      context.must_not_include_any ?? [],
    );
    const anyRequired = context.must_include_any ?? [];
    const allRequired = context.must_include_all ?? [
      context.name,
      ...context.owns,
    ];
    const exactRequiredHit =
      (anyRequired.length === 0 || includesAny(candidateText, anyRequired)) &&
      includesAll(candidateText, allRequired);
    const requiredHit =
      exactRequiredHit ||
      acceptedAlternativeHit(candidateText, context.accepted_alternatives);
    return {
      id: context.id,
      kind: "boundary",
      severity: "critical",
      verdict: forbiddenHit
        ? "contradicted"
        : requiredHit
          ? "covered"
          : "missing",
      evidence: forbiddenHit
        ? "forbidden boundary text evidence found"
        : requiredHit
          ? "context ownership text evidence found"
          : "no context ownership text evidence found",
    };
  });

export const verdictForFindings = (findings) => {
  if (
    findings.some(
      (finding) =>
        finding.severity === "critical" &&
        ["missing", "contradicted", "invented"].includes(finding.verdict),
    )
  ) {
    return "red";
  }
  if (
    findings.some((finding) =>
      ["missing", "contradicted", "invented", "unknown"].includes(
        finding.verdict,
      ),
    )
  ) {
    return "yellow";
  }
  return "green";
};
