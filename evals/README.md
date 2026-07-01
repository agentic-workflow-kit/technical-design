# Evaluation and Acceptance

This directory contains the consumer-facing eval suite for the `technical-design` skills pack.

It uses [`@agentic-workflow-kit/eval-kit`](../packages/eval-kit) for all generic mechanics
(schema validation, path resolution, Promptfoo helpers, result manifests). This directory owns
only the `technical-design` domain: DDD fixtures, expected facts and boundaries, judge rubrics,
lessons-ledger checks, and deterministic grading policy.

The layered design-quality strategy lives in
[`docs/design/evaluation-strategy.md`](../docs/design/evaluation-strategy.md).
The implementation plan lives in
[`implementation-plan.md`](./implementation-plan.md).

## Structure

```
evals/
  eval-kit.config.json      # Eval suite configuration (entry point)
  adapter.mjs               # Domain adapter: grader, reporter, validator, var resolvers
  rubric.md                 # Judge rubric for pointwise and pairwise semantic evaluation
  cases/                    # Seven self-contained product-to-design cases
  fixtures/
    ddd/                    # DDD defect-class fixtures
    enforce/                # Executable dependency-cruiser enforcement fixtures
    review/                 # Expected review suggestions for defective design
    planning/               # Design-to-planning input fixture
    outcomes/               # Outcome-study templates
  schemas/                  # Consumer-specific JSON Schemas (domain fixtures)
  tests/                    # Vitest integration tests for graders and fixture validation
  results/                  # Ignored local run outputs (only results/README.md is committed)
```

Generic judge prompt templates (`pointwise.prompt.md`, `pairwise.prompt.md`) are bundled in
the `eval-kit` package and do not need to be present here.

## Deterministic eval classes

Examples include:

- Missing bounded context ownership
- Invented failure token
- Unsourced invariant operand
- Public API exposure gap
- Vacuous enforcement rule without seeded violation
- Prose-only or empty planner handoff
- Source-invisible handoff fact
- Missing producer source closure
- Proof-substrate mismatch

The current DDD defect classes are declared in `fixtures/ddd/defect-manifest.json`.

The product-to-design cases graded by `eval:case`:

- `case-aerial-delivery-shipping-v1`
- `case-cloudevents-core-contract-v1`
- `case-customer-credit-order-saga-v1`
- `case-fineract-loan-lifecycle-v1`
- `case-kubernetes-sidecar-containers-v1`
- `case-openfeature-evaluation-api-v1`
- `case-tiny-laundry-pickup-v1`

## Running checks

The repository gate:

```bash
pnpm check
```

Individual eval checks:

```bash
pnpm check:eval-static     # skills, schema, profile, fixture validation
pnpm eval:unit             # Vitest unit and integration tests
pnpm eval:enforce          # Deterministic enforce-architecture eval
```

Run a single deterministic case:

```bash
pnpm eval:case -- --case case-tiny-laundry-pickup-v1 --candidate evals/cases/case-tiny-laundry-pickup-v1/reference-design.md
```

## Reading the evals

1. `eval-kit.config.json` — suite config; start here to understand what runs.
2. `adapter.mjs` — all domain-specific logic in one file.
3. `rubric.md` — judge rubric for semantic evaluation.
4. `cases/README.md` — authoring contract for product-to-design cases.
5. `results/README.md` — conventions for generated run outputs.

## Manual Product-to-Design Flow

Manual model-graded runs use Promptfoo with the Codex App Server provider. They are advisory only
and not part of `pnpm check`.

Check local auth:

```bash
codex login status
```

Generate a candidate design:

```bash
pnpm eval:generate -- --case <case-id> --model gpt-5.4 --provider openai --effort medium --run-id <run-id>-generate
```

Grade deterministically:

```bash
pnpm eval:case -- --case <case-id> --candidate evals/results/<run-id>-generate/cases/<case-id>/candidate.md --run-id <run-id>-deterministic
```

Run pointwise coverage judging:

```bash
pnpm eval:judge:coverage -- --case <case-id> --candidate evals/results/<run-id>-generate/cases/<case-id>/candidate.md --model gpt-5.4 --provider openai --effort medium --run-id <run-id>-pointwise
```

Run pairwise judging only after deterministic blockers are understood and
`methods.judge_pairwise.enabled` is set to `true` in `eval-kit.config.json`:

```bash
pnpm eval:judge -- --case <case-id> --candidate-a <a.md> --candidate-b <b.md> --model gpt-5.4 --provider openai --effort medium --seed <seed> --run-id <run-id>-pairwise
```

Write a combined manual report:

```bash
pnpm eval:manual-report -- --run-id <run-id> --generate <run-id>-generate --deterministic <run-id>-deterministic --judge-coverage <run-id>-pointwise
```

Generated outputs go under `evals/results/<run-id>/` and are ignored by default. A result bundle
includes `manifest.json`, `report.md`, `grades.json`, and per-case evidence files.
