# Evaluation and Acceptance

This directory contains fixtures and checks for the DDD-first `technical-design` pack.

The layered design-quality strategy lives in
[`docs/design/evaluation-strategy.md`](../docs/design/evaluation-strategy.md).
The implementation and execution plan lives in
[`implementation-plan.md`](./implementation-plan.md).

## Structure

- `frame/` - expected source-grounded problem-frame behavior.
- `author/` - expected DDD technical-design output properties.
- `review/` - intentionally defective design plus expected suggestion classes.
- `ddd/` - defect-class fixtures for DDD review and methodology readiness.
- `enforce/` - executable dependency-cruiser fixture proving seeded boundary failures.
- `schemas/` - JSON Schemas for deterministic fixtures and generated result contracts.
- `tests/` - Vitest coverage for validator failure modes.
- `cases/` - self-contained product-to-design case fixtures.
- `judges/` - manual model-graded judge rubrics and Promptfoo template.
- `outcomes/` - redacted outcome-study templates for downstream delivery friction.
- `results/` - ignored local run outputs; only `results/README.md` is committed.
- `run_case_eval.mjs` - deterministic case runner for candidate designs.
- `validate_eval_fixtures.mjs` - deterministic validation for review expectations and DDD defect
  manifests.
- `run_static_checks.sh` - local validation for skills, schema, profile files, and private source-name
  leaks.

## Initial deterministic eval classes

- Missing bounded context ownership.
- Invented failure token.
- Unsourced invariant operand.
- Public API exposure gap.
- Vacuous enforcement rule without seeded violation.
- Prose-only or empty planner handoff.

The current deterministic DDD defect classes are declared in `ddd/defect-manifest.json`. Static
checks verify that each initial defect class points to an existing fixture, a known lesson, and
exact DDD review-rubric text. `review/expected-suggestions.json` uses the same suggestion shape as
`skills/review-technical-design/templates/suggestion.schema.json`.

## Verifiable enforcement requirement

The `enforce` eval proves that generated dependency-cruiser rules fail for seeded violations:

1. Generate `.dependency-cruiser.js` from each layer map.
2. Run dependency-cruiser against `evals/enforce/src`.
3. Confirm the seeded violation fails for declared rules.
4. Confirm no-boundary CRUD passes honestly with an empty config.

Run:

```bash
bash evals/run_static_checks.sh
bash evals/enforce/run_evals.sh
pnpm eval:unit
```

The repository gate is:

```bash
pnpm check
```

## Reading the Evals

Start here:

1. Read `implementation-plan.md` for what is implemented, what is planned, which agents/reviewers
   participate, and where integration points sit.
2. Read `ddd/defect-manifest.json` for the deterministic DDD defect classes covered today.
3. Read `review/expected-suggestions.json` for the expected structured review output.
4. Read `cases/README.md` before adding product-to-design cases.
5. Read `judges/README.md` before running model-graded evals.
6. Read `results/README.md` before writing or inspecting generated eval outputs.

Run a deterministic case manually:

```bash
pnpm eval:case -- --case case-tiny-laundry-pickup-v1 --candidate evals/cases/case-tiny-laundry-pickup-v1/reference-design.md
```

Generated outputs belong under `evals/results/<run-id>/` and are ignored by default. A result bundle
should include `manifest.json`, `report.md`, `grades.json`, and per-case evidence files when a
runner writes case outputs.
