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

const orderedTokenIncludes = (normalizedText, snippet) => {
  const snippetTokens = normalize(snippet).split(" ").filter(Boolean);
  if (snippetTokens.length === 0) {
    return false;
  }

  const textTokens = normalizedText.split(" ").filter(Boolean);
  let nextSnippetIndex = 0;
  for (const token of textTokens) {
    if (token === snippetTokens[nextSnippetIndex]) {
      nextSnippetIndex += 1;
    }
    if (nextSnippetIndex === snippetTokens.length) {
      return true;
    }
  }
  return false;
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

const listMarkerPattern = /^(\s*)(?:[-*]|\d+\.)\s+/;
const tableRowPattern = /^\s*\|/;
const ownershipPhrasePattern = /\b(?:owns?|reads?|does\s+not\s+own)\b/i;
const terminalSentencePattern = /[.!?)]$/;

const isListItem = (line) => listMarkerPattern.test(line);

const listIndent = (line) => {
  const match = line.match(listMarkerPattern);
  return match ? match[1].length : null;
};

const isNestedListItem = (line) => {
  const indent = listIndent(line);
  return indent !== null && indent > 0;
};

const isPlainListChild = (line) =>
  isListItem(line) && !ownershipPhrasePattern.test(line);

const currentEndsWithColon = (currentLines) =>
  currentLines.at(-1)?.trim().endsWith(":") ?? false;

const currentEndsSentence = (currentLines) =>
  terminalSentencePattern.test(currentLines.at(-1)?.trim() ?? "");

const candidateSegments = (text) => {
  const segments = [];
  let currentLines = [];
  let acceptsPlainListChildren = false;

  const flush = () => {
    if (currentLines.length > 0) {
      segments.push(currentLines.join("\n").trim());
      currentLines = [];
    }
    acceptsPlainListChildren = false;
  };

  const pushCurrentLine = (line) => {
    currentLines.push(line);
    if (line.trim().endsWith(":")) {
      acceptsPlainListChildren = true;
    }
  };

  for (const rawLine of String(text ?? "").split("\n")) {
    const line = rawLine.trimEnd();
    if (line.trim().length === 0) {
      flush();
      continue;
    }

    if (tableRowPattern.test(line)) {
      flush();
      segments.push(line.trim());
      continue;
    }

    if (isNestedListItem(line)) {
      pushCurrentLine(line);
      continue;
    }

    if (isListItem(line)) {
      if (
        currentLines.length > 0 &&
        (currentEndsWithColon(currentLines) || acceptsPlainListChildren) &&
        isPlainListChild(line)
      ) {
        pushCurrentLine(line);
        continue;
      }
      flush();
      pushCurrentLine(line);
      continue;
    }

    if (currentLines.length > 0 && !currentEndsSentence(currentLines)) {
      pushCurrentLine(line);
      continue;
    }

    flush();
    pushCurrentLine(line);
  }

  flush();
  return segments;
};

const findCoLocatedSnippetSegment = (text, snippets = []) =>
  candidateSegments(text).find((segment) => {
    const normalizedSegment = normalize(segment);
    return snippets.every(
      (snippet) =>
        normalizedIncludes(normalizedSegment, snippet) ||
        orderedTokenIncludes(normalizedSegment, snippet),
    );
  });

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
  const coLocatedSegment =
    options.requireCoLocatedAll && allRequired.length > 0
      ? findCoLocatedSnippetSegment(candidateText, allRequired)
      : null;
  const requiredEvidenceHit =
    options.requireCoLocatedAll && allRequired.length > 0
      ? Boolean(coLocatedSegment)
      : missingAll.length === 0;
  const exactRequiredHit =
    (anyRequired.length === 0 || anyHit) &&
    requiredEvidenceHit &&
    (!options.requireCoLocatedAll ||
      allRequired.length === 0 ||
      Boolean(coLocatedSegment));

  if (exactRequiredHit) {
    const evidenceParts = [];
    if (anyHit) {
      evidenceParts.push(`any=${formatSnippets([anyHit])}`);
    }
    if (allRequired.length > 0) {
      evidenceParts.push(`all=${formatSnippets(allRequired)}`);
    }
    if (coLocatedSegment) {
      evidenceParts.push(`segment=${formatSnippets([coLocatedSegment])}`);
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
    evidence: [
      "missing required evidence",
      anyRequired.length > 0 && !anyHit
        ? `missing_any=${formatSnippets(anyRequired)}`
        : "",
      missingAll.length > 0 ? `missing_all=${formatSnippets(missingAll)}` : "",
      options.requireCoLocatedAll &&
      allRequired.length > 0 &&
      missingAll.length === 0
        ? `not_co_located=${formatSnippets(allRequired)}`
        : "",
    ]
      .filter(Boolean)
      .join("; "),
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
      requireCoLocatedAll: true,
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
