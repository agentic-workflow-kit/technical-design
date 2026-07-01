# Eval Kit Adapter Contract

Eval Kit stays generic by loading consumer modules dynamically. The consumer provides domain
behavior through graders, reporters, and hooks declared in `eval-kit.config.json`.

## Loading Rules

Adapter module paths are resolved from `suite_root`.

```json
{
  "suite_root": ".",
  "graders": {
    "facts-boundaries": "hooks.mjs"
  },
  "reporters": {
    "markdown": "hooks.mjs"
  },
  "hooks": {
    "module": "hooks.mjs"
  }
}
```

The same module can implement all exports. Larger suites can split graders and reporters into
separate modules.

## Deterministic Grader

The `run-case` command picks:

- `runner_defaults.grader`, when set; otherwise
- the first key in `graders`.

The module must export one of:

```js
export const gradeTechnicalDesignCandidate = ({
  candidateText,
  expectedFacts,
}) => {
  return {
    verdict: "green",
    findings: [],
  };
};

export const gradeCandidate = ({ candidateText }) => ({
  verdict: "green",
  findings: [],
});

export default ({ candidateText }) => ({ verdict: "green", findings: [] });
```

Input object:

```js
{
  candidateText: "...",
  expectedFacts: {...},
  expectedBoundaries: {...}
}
```

The kit builds extra keys from manifest artifacts with role `grader_input`:

- read JSON from each artifact;
- remove `.json`;
- camel-case dash-separated names.

Examples:

- `expected-facts.json` becomes `expectedFacts`;
- `expected-boundaries.json` becomes `expectedBoundaries`.

Return object:

```js
{
  verdict: "red" | "yellow" | "green" | "great",
  findings: [
    {
      id: "FACT-001",
      kind: "fact",
      severity: "critical",
      verdict: "covered",
      evidence: "exact evidence hit"
    }
  ]
}
```

The return value is validated with `grades.schema.json`.

## Deterministic Reporter

The `run-case` command picks:

- `runner_defaults.reporter`, when set; otherwise
- the first key in `reporters`.

The module must export one of:

```js
export const renderDeterministicReport = (input) => "# Eval Report\n";
export const renderReport = (input) => "# Eval Report\n";
export default (input) => "# Eval Report\n";
```

Input object:

```js
{
  (caseId, grades, findings, caseDir, candidatePath, resolver);
}
```

Return a Markdown string. The kit writes it to `report.md`.

## Generation Hook

The `generate` command requires:

```js
export const resolveGenerationVars = async ({
  caseId,
  caseDir,
  artifacts,
  resolver,
}) => {
  return {
    product_md: "...",
    source_map_md: "...",
    author_skill_md: "...",
    technical_design_template_md: "...",
    bounded_context_template_md: "...",
    enforcement_map_template_md: "...",
    ddd_eval_expectations_md: "...",
  };
};
```

The returned object becomes Promptfoo `vars`. The bundled generation prompt currently references
the variable names shown above. Consumers can either return those variables or override
`prompt_templates.generation` in config.

## Pointwise Judge Hook

The `judge-coverage` command requires:

```js
export const resolvePointwiseVars = async ({
  caseId,
  caseDir,
  artifacts,
  candidateContent,
  candidatePath,
  promptVersion,
  rubricVersion,
  model,
  provider,
  resolver
}) => {
  return {
    case_id: caseId,
    model,
    provider,
    prompt_version: promptVersion,
    rubric_version: rubricVersion,
    source_facts: "...",
    expected_items: JSON.stringify([...], null, 2),
    candidate_path: resolver.relativeToRepo(candidatePath),
    candidate: candidateContent,
    _expectedItemsForCanonicalization: [...]
  };
};
```

Optional post-processing:

```js
export const canonicalizeExpectedItemMetadata = (
  actualItems,
  expectedItems,
) => {
  return expectedItems.map((expected) => ({
    ...actualItems.find((item) => item.item_id === expected.item_id),
    kind: expected.kind,
    severity: expected.severity,
    source_refs: expected.source_refs,
  }));
};
```

Use this hook when the model should judge content but not rewrite trusted metadata.

## Pairwise Judge Hook

The `judge-pairwise` command requires:

```js
export const resolvePairwiseVars = async ({
  caseId,
  caseDir,
  artifacts,
  candidateAContent,
  candidateBContent,
  candidateAPath,
  candidateBPath,
  promptVersion,
  rubricVersion,
  model,
  provider,
  randomizedOrder,
  resolver,
}) => {
  return {
    case_id: caseId,
    model,
    provider,
    prompt_version: promptVersion,
    rubric_version: rubricVersion,
    source_facts: "...",
    candidate_a: candidateAContent,
    candidate_b: candidateBContent,
    randomization_seed: randomizedOrder.seed,
    randomization_order: randomizedOrder.candidate_order.join(", "),
  };
};
```

Current limitation: pairwise command wiring exists, but the bundled prompt, `judge-output` schema,
and `pairwise-result` schema need alignment before this path is stable.

## Manual Report Hook

The `report` command requires:

```js
export const compileReport = async ({
  config,
  runId,
  runs,
  resultDir,
  resolver,
}) => {
  return {
    reportContent: "# Manual Combined Report\n",
    caseIds: ["case-example-v1"],
    artifacts: [
      {
        role: "deterministic_grades",
        path: "deterministic_grades.json",
        mediaType: "application/json",
      },
    ],
    outputFiles: ["deterministic_grades.json"],
  };
};
```

The hook is responsible for copying or writing any extra artifacts it lists. Eval Kit always writes
`report.md` and `manifest.json`.

## Fixture Validation Hook

The `validate-fixtures` command validates configured case manifests, then calls:

```js
export const validateFixtures = async ({ config, manifests }) => {
  for (const { manifest, fullPath, relativePath } of manifests) {
    // suite-specific checks
  }
};
```

Throw an error to fail validation.

## Resolver API

Hooks receive `resolver`, created by `createPathResolver`.

Useful methods:

- `resolveRunDir(runId)`
- `resolveResultArtifact(runDir, relativePath, label)`
- `resolveSuitePath(relativePath, label)`
- `resolveRepoPath(relativePath, label)`
- `relativeToRepo(absolutePath)`
- `relativeToSuite(absolutePath)`
- `relativeToResults(absolutePath)`

All path methods enforce containment. Run ids use `assertSafeId`, so ids cannot contain path
separators.
