# Eval Kit Examples

These examples use the current `technical-design` consumer layout, but the same patterns apply to
any suite that provides config, manifests, and adapters.

## Deterministic Reference Case

Run the tiny reference design through deterministic grading:

```bash
pnpm eval:case -- \
  --case case-tiny-laundry-pickup-v1 \
  --candidate evals/cases/case-tiny-laundry-pickup-v1/reference-design.md \
  --run-id verify-tiny-reference
```

Expected files:

```text
evals/results/verify-tiny-reference/
  manifest.json
  grades.json
  report.md
  cases/case-tiny-laundry-pickup-v1/candidate.md
  cases/case-tiny-laundry-pickup-v1/grader-output.json
```

Expected report headline:

```text
Verdict: green
Blocker findings: 0
```

## Direct Binary Invocation

```bash
eval-kit run-case \
  --config evals/eval-kit.config.json \
  --case case-tiny-laundry-pickup-v1 \
  --candidate evals/cases/case-tiny-laundry-pickup-v1/reference-design.md \
  --run-id direct-tiny-reference
```

## Minimal Grader

```js
export const gradeCandidate = ({ candidateText, expectedFacts }) => {
  const findings = expectedFacts.facts.map((fact) => ({
    id: fact.id,
    kind: "fact",
    severity: fact.severity,
    verdict: candidateText.includes(fact.must_include_any[0])
      ? "covered"
      : "missing",
    evidence: candidateText.includes(fact.must_include_any[0])
      ? `found ${fact.must_include_any[0]}`
      : `missing ${fact.must_include_any[0]}`,
  }));

  const hasBlocker = findings.some(
    (finding) =>
      finding.severity === "critical" && finding.verdict !== "covered",
  );

  return {
    verdict: hasBlocker ? "red" : "green",
    findings,
  };
};
```

## Minimal Reporter

```js
export const renderReport = ({ caseId, grades, findings }) => {
  return [
    `# Eval Report: ${caseId}`,
    "",
    `Verdict: ${grades.verdict}`,
    "",
    "## Findings",
    "",
    ...findings.map(
      (finding) =>
        `- ${finding.id} (${finding.severity}): ${finding.verdict} - ${finding.evidence}`,
    ),
  ].join("\n");
};
```

## Fixture Validation

```bash
eval-kit validate-fixtures --config evals/eval-kit.config.json
```

The kit validates discovered case manifests first. If `adapter.validateFixtures` exists, the kit
calls it with:

```js
{
  config,
  manifests: [
    {
      manifest,
      fullPath,
      relativePath
    }
  ]
}
```

## Candidate Generation

```bash
pnpm eval:generate -- \
  --case case-tiny-laundry-pickup-v1 \
  --model gpt-5.4 \
  --provider openai \
  --effort medium \
  --run-id tiny-generate
```

This writes:

```text
evals/results/tiny-generate/
  manifest.json
  report.md
  promptfooconfig.json
  promptfoo-results.json
  promptfoo-report.html
  cases/case-tiny-laundry-pickup-v1/candidate.md
```

Requirements:

- `promptfoo` installed in the consumer repo;
- `codex login status` succeeds;
- `adapter.resolveGenerationVars` returns variables expected by the prompt.

## Pointwise Judge

```bash
pnpm eval:judge:coverage -- \
  --case case-tiny-laundry-pickup-v1 \
  --candidate evals/results/tiny-generate/cases/case-tiny-laundry-pickup-v1/candidate.md \
  --model gpt-5.4 \
  --provider openai \
  --effort medium \
  --run-id tiny-pointwise
```

This writes:

```text
evals/results/tiny-pointwise/
  manifest.json
  report.md
  pointwise-result.json
  promptfooconfig.json
  promptfoo-results.json
  promptfoo-report.html
```

## Combined Manual Report

```bash
pnpm eval:manual-report -- \
  --run-id tiny-report \
  --deterministic verify-tiny-reference \
  --judge-coverage tiny-pointwise
```

The suite hook decides how to combine parent runs. Eval Kit writes a v2 result manifest for the
combined report.

## Programmatic Use

```js
import {
  loadConfig,
  runCase,
  discoverCaseIds,
} from "@agentic-workflow-kit/eval-kit";

const config = loadConfig("evals/eval-kit.config.json");
const cases = discoverCaseIds(config);

await runCase({
  config,
  caseId: cases[0],
  candidatePath: "evals/cases/case-tiny-laundry-pickup-v1/reference-design.md",
  runId: "programmatic-run",
});
```

## Safe Paths

```js
import { createPathResolver } from "@agentic-workflow-kit/eval-kit";

const resolver = createPathResolver({
  repoRoot: process.cwd(),
  configDir: `${process.cwd()}/evals`,
  suiteRoot: ".",
  resultsRoot: "results",
});

const runDir = resolver.resolveRunDir("example-run");
const manifestPath = resolver.resolveResultArtifact(
  runDir,
  "manifest.json",
  "manifest",
);
```

`resolveRunDir("../bad")` throws because run ids must be ids, not paths.
