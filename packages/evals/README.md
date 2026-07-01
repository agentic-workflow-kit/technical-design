# Evaluation and Acceptance

This directory contains fixtures and checks for the DDD-first `technical-design` pack.

`technical-design` now consumes the local private
`@agentic-workflow-kit/eval-kit` package for portable mechanics such as schema validation, path
containment, Promptfoo raw-output helpers, artifact records, and v2 result manifests. The suite still
owns all `technical-design` semantics: DDD fixtures, expected facts and boundaries, review rubrics,
lessons-ledger checks, prompt templates, and deterministic grading policy.

The layered design-quality strategy lives in
[`docs/design/evaluation-strategy.md`](../../docs/design/evaluation-strategy.md).
The implementation and execution plan lives in
[`implementation-plan.md`](./implementation-plan.md).
The Promptfoo/Codex pilot design lives in
[`docs/design/promptfoo-codex-eval-pilot.md`](../../docs/design/promptfoo-codex-eval-pilot.md).

## Structure

- `fixtures/frame/` - expected source-grounded problem-frame behavior.
- `fixtures/author/` - expected DDD technical-design output properties.
- `fixtures/review/` - intentionally defective design plus expected suggestion classes.
- `fixtures/ddd/` - defect-class fixtures for DDD review and methodology readiness.
- `fixtures/enforce/` - executable dependency-cruiser fixture proving seeded boundary failures.
- `schemas/` - JSON Schemas for deterministic fixtures and generated result contracts.
- `tests/` - Vitest coverage for validator failure modes.
- `fixtures/cases/` - seven self-contained product-to-design case fixtures.
- `promptfoo/judges/` - manual model-graded judge rubrics and Promptfoo template.
- `fixtures/outcomes/` - redacted outcome-study templates for downstream delivery friction.
- `results/` - ignored local run outputs; only `results/README.md` is committed.
- `src/run_case_eval.mjs` - deterministic case runner for candidate designs.
- `src/run_generate_eval.mjs` - manual Promptfoo candidate-generation runner.
- `src/run_pointwise_judge_eval.mjs` - manual Promptfoo pointwise coverage judge runner.
- `src/run_judge_eval.mjs` - manual Promptfoo pairwise judge runner.
- `src/run_manual_report.mjs` - manual report combiner for generation, deterministic, judge, and
  outcome bundles.
- `src/validate_eval_fixtures.mjs` - deterministic validation for review expectations and DDD
  defect manifests.
- `src/run_static_checks.sh` - local validation for skills, schema, profile files, and private
  source-name leaks.

## Current deterministic eval classes

- Missing bounded context ownership.
- Invented failure token.
- Unsourced invariant operand.
- Public API exposure gap.
- Vacuous enforcement rule without seeded violation.
- Prose-only or empty planner handoff.

The current deterministic DDD defect classes are declared in `fixtures/ddd/defect-manifest.json`. Static
checks verify that each initial defect class points to an existing fixture, a known lesson, and
exact DDD review-rubric text. `fixtures/review/expected-suggestions.json` uses the same suggestion
shape as `skills/review-technical-design/templates/suggestion.schema.json`.

The product-to-design deterministic runner currently grades these committed cases:

- `case-aerial-delivery-shipping-v1`
- `case-cloudevents-core-contract-v1`
- `case-customer-credit-order-saga-v1`
- `case-fineract-loan-lifecycle-v1`
- `case-kubernetes-sidecar-containers-v1`
- `case-openfeature-evaluation-api-v1`
- `case-tiny-laundry-pickup-v1`

It writes red/yellow/green deterministic verdicts only. The `great` verdict is reserved for
manual/report-level comparison after green deterministic coverage and calibrated pairwise evidence;
deterministic `eval:case` does not emit `great`.

Case authors should use [`fixtures/cases/README.md`](./fixtures/cases/README.md) as the local
authoring contract for case purpose, required files, source-visible expectations, reference anchors,
rubrics, grader notes, and provenance.

## Verifiable enforcement requirement

The `enforce` eval proves that generated dependency-cruiser rules fail for seeded violations:

1. Generate `.dependency-cruiser.cjs` from each layer map.
2. Run dependency-cruiser against `packages/evals/fixtures/enforce/src`.
3. Confirm the seeded violation fails for declared rules.
4. Confirm no-boundary CRUD passes honestly with an empty config.

Run:

```bash
bash packages/evals/src/run_static_checks.sh
bash packages/evals/src/run_enforce_eval.sh
pnpm --filter @agentic-workflow-kit/technical-design-evals eval:unit
```

The repository gate is:

```bash
pnpm check
```

## Reading the Evals

Start here:

1. Read `implementation-plan.md` for what is implemented, what is planned, which agents/reviewers
   participate, and where integration points sit.
2. Read `fixtures/ddd/defect-manifest.json` for the deterministic DDD defect classes covered today.
3. Read `fixtures/review/expected-suggestions.json` for the expected structured review output.
4. Read `fixtures/cases/README.md` before adding product-to-design cases.
5. Read `promptfoo/judges/README.md` before running model-graded evals.
6. Read `results/README.md` before writing or inspecting generated eval outputs.

Run a deterministic case manually:

```bash
pnpm --filter @agentic-workflow-kit/technical-design-evals eval:case -- --case case-tiny-laundry-pickup-v1 --candidate packages/evals/fixtures/cases/case-tiny-laundry-pickup-v1/reference-design.md
```

## Manual Product-to-Design Flow

Manual model-graded runs use Promptfoo with the Codex App Server provider and local Codex auth. They
are not part of `pnpm check` and must be treated as advisory until human calibration exists.

Check local auth before model-graded runs:

```bash
codex login status
```

Generate a candidate design:

```bash
pnpm --filter @agentic-workflow-kit/technical-design-evals eval:generate -- --case <case-id> --model gpt-5.4 --provider openai --effort medium --run-id <run-id>-generate
```

Input:

- `fixtures/cases/<case-id>/product.md`
- `fixtures/cases/<case-id>/source-map.md`
- active design skill and methodology instructions included by the generation runner

Output:

- `results/<run-id>-generate/cases/<case-id>/candidate.md`
- `results/<run-id>-generate/promptfoo-results.json`
- `results/<run-id>-generate/promptfoo-report.html`
- `results/<run-id>-generate/manifest.json`
- `results/<run-id>-generate/report.md`

Grade the generated candidate deterministically:

```bash
pnpm --filter @agentic-workflow-kit/technical-design-evals eval:case -- --case <case-id> --candidate packages/evals/results/<run-id>-generate/cases/<case-id>/candidate.md --run-id <run-id>-deterministic
```

Input:

- candidate design markdown
- `fixtures/cases/<case-id>/expected-facts.json`
- `fixtures/cases/<case-id>/expected-boundaries.json`

Output:

- `results/<run-id>-deterministic/grades.json`
- `results/<run-id>-deterministic/report.md`
- `results/<run-id>-deterministic/manifest.json`
- `results/<run-id>-deterministic/cases/<case-id>/candidate.md`
- `results/<run-id>-deterministic/cases/<case-id>/grader-output.json`

The report lists the overall verdict, blocker count, verdict counts, and per-finding evidence. Fact
findings show exact, alternative, concept-group, or missing/contradicted evidence. Boundary findings
also show the local candidate segment that proved default ownership coverage, so scattered context
and owned nouns do not pass without nearby ownership evidence.

Run pointwise coverage judging:

```bash
pnpm --filter @agentic-workflow-kit/technical-design-evals eval:judge:coverage -- --case <case-id> --candidate packages/evals/results/<run-id>-generate/cases/<case-id>/candidate.md --model gpt-5.4 --provider openai --effort medium --run-id <run-id>-pointwise
```

Input:

- `product.md` and `source-map.md`
- expected facts and boundaries
- candidate design markdown

Output:

- `results/<run-id>-pointwise/pointwise-result.json`
- `results/<run-id>-pointwise/promptfooconfig.json`
- `results/<run-id>-pointwise/promptfoo-results.json`
- `results/<run-id>-pointwise/promptfoo-report.html`
- `results/<run-id>-pointwise/manifest.json`
- `results/<run-id>-pointwise/report.md`

Run pairwise judging only after deterministic blockers are understood:

```bash
pnpm --filter @agentic-workflow-kit/technical-design-evals eval:judge -- --case <case-id> --candidate-a <candidate-a.md> --candidate-b <candidate-b.md> --model gpt-5.4 --provider openai --effort medium --seed <seed> --run-id <run-id>-pairwise
```

Write a final manual report:

```bash
pnpm --filter @agentic-workflow-kit/technical-design-evals eval:manual-report -- --run-id <run-id> --generate <run-id>-generate --deterministic <run-id>-deterministic --judge-coverage <run-id>-pointwise
```

Generated outputs belong under `packages/evals/results/<run-id>/` and are ignored by default. A result bundle
should include `manifest.json`, `report.md`, `grades.json`, and per-case evidence files when a
runner writes case outputs. Model-graded bundles additionally include Promptfoo JSON/HTML exports
and structured judge output such as `pointwise-result.json` or `pairwise-result.json`.
