# Evaluation and Acceptance

This directory contains fixtures and checks for the DDD-first `technical-design` pack.

The layered design-quality strategy lives in
[`docs/design/evaluation-strategy.md`](../docs/design/evaluation-strategy.md).

## Structure

- `frame/` - expected source-grounded problem-frame behavior.
- `author/` - expected DDD technical-design output properties.
- `review/` - intentionally defective design plus expected suggestion classes.
- `ddd/` - defect-class fixtures for DDD review and methodology readiness.
- `enforce/` - executable dependency-cruiser fixture proving seeded boundary failures.
- `run_static_checks.sh` - local validation for skills, schema, profile files, and private source-name
  leaks.

## Required eval classes

- Missing bounded context ownership.
- Invented failure token.
- Unsourced invariant operand.
- Public API exposure gap.
- Vacuous enforcement rule without seeded violation.

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
```
