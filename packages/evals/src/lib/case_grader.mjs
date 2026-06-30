export const normalize = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[`*_~]/g, "")
    .replace(/[‘’‛′']/g, "")
    .replace(/[“”«»"]/g, "")
    .replace(/[‐‑‒–—―]/g, "-")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizedIncludes = (normalizedText, snippet) => {
  const normalizedSnippet = normalize(snippet);
  if (!normalizedSnippet) {
    return false;
  }
  return ` ${normalizedText} `.includes(` ${normalizedSnippet} `);
};

const findIncludedSnippet = (text, snippets = []) => {
  const normalizedText = normalize(text);
  return snippets.find((snippet) =>
    normalizedIncludes(normalizedText, snippet),
  );
};

const findMissingSnippets = (text, snippets = []) => {
  const normalizedText = normalize(text);
  return snippets.filter(
    (snippet) => !normalizedIncludes(normalizedText, snippet),
  );
};

export const includesAny = (text, snippets = []) =>
  Boolean(findIncludedSnippet(text, snippets));

export const includesAll = (text, snippets = []) =>
  findMissingSnippets(text, snippets).length === 0;

const findAcceptedAlternativeMatch = (candidateText, alternatives = []) =>
  alternatives.find((alternative) => {
    const forbiddenHit = includesAny(
      candidateText,
      alternative.must_not_include_any ?? [],
    );
    return (
      !forbiddenHit &&
      includesAll(candidateText, alternative.must_include_all ?? [])
    );
  });

const findRequiredConceptMatch = (candidateText, conceptGroups = []) => {
  if (conceptGroups.length === 0) {
    return null;
  }

  const matchedGroups = conceptGroups.filter((group) =>
    includesAny(candidateText, group.any_of ?? []),
  );
  if (matchedGroups.length !== conceptGroups.length) {
    return null;
  }

  return matchedGroups;
};

const formatSnippets = (snippets) =>
  snippets.map((snippet) => `"${snippet}"`).join(", ");

const assessCoverage = (candidateText, expectation, options = {}) => {
  const forbiddenSnippet = findIncludedSnippet(
    candidateText,
    expectation.must_not_include_any ?? [],
  );
  if (forbiddenSnippet) {
    return {
      verdict: "contradicted",
      evidence: `forbidden evidence hit: ${formatSnippets([forbiddenSnippet])}`,
    };
  }

  const anyRequired = expectation.must_include_any ?? [];
  const allRequired =
    expectation.must_include_all ?? options.defaultMustIncludeAll ?? [];
  const anyHit =
    anyRequired.length === 0
      ? null
      : findIncludedSnippet(candidateText, anyRequired);
  const missingAll = findMissingSnippets(candidateText, allRequired);
  const exactRequiredHit =
    (anyRequired.length === 0 || anyHit) && missingAll.length === 0;

  if (exactRequiredHit) {
    const evidenceParts = [];
    if (anyHit) {
      evidenceParts.push(`any=${formatSnippets([anyHit])}`);
    }
    if (allRequired.length > 0) {
      evidenceParts.push(`all=${formatSnippets(allRequired)}`);
    }
    return {
      verdict: "covered",
      evidence: `exact evidence hit${evidenceParts.length > 0 ? `: ${evidenceParts.join("; ")}` : ""}`,
    };
  }

  const alternativeMatch = findAcceptedAlternativeMatch(
    candidateText,
    expectation.accepted_alternatives,
  );
  if (alternativeMatch) {
    return {
      verdict: "covered",
      evidence: `accepted alternative matched: ${alternativeMatch.label}`,
    };
  }

  const conceptMatch = findRequiredConceptMatch(
    candidateText,
    expectation.required_concepts,
  );
  if (conceptMatch) {
    return {
      verdict: "covered",
      evidence: `concept groups matched: ${conceptMatch.map((group) => group.label).join(", ")}`,
    };
  }

  return {
    verdict: "missing",
    evidence: "missing required evidence",
  };
};

export const gradeFacts = (candidateText, expectedFacts) =>
  expectedFacts.facts.map((fact) => {
    const assessment = assessCoverage(candidateText, fact);
    return {
      id: fact.id,
      kind: "fact",
      severity: fact.severity,
      verdict: assessment.verdict,
      evidence: assessment.evidence,
    };
  });

export const gradeBoundaries = (candidateText, expectedBoundaries) =>
  expectedBoundaries.contexts.map((context) => {
    const assessment = assessCoverage(candidateText, context, {
      defaultMustIncludeAll: [context.name, ...context.owns],
    });
    return {
      id: context.id,
      kind: "boundary",
      severity: "critical",
      verdict: assessment.verdict,
      evidence: assessment.evidence,
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

export const criticalBlockerCount = (findings) =>
  findings.filter(
    (finding) =>
      finding.severity === "critical" &&
      ["missing", "contradicted", "invented"].includes(finding.verdict),
  ).length;
