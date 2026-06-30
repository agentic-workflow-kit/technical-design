# Judge Evals

Judge evals are manual/model-graded until calibration proves they are reliable enough for release
signals. They must never override deterministic schema, source-fact, or enforcement failures.

## Rules

- Allow `unknown` when evidence is insufficient.
- Cite candidate and expected-fact evidence in every result.
- Do not reward length, familiar architecture vocabulary, or rhetorical confidence without source
  support.
- Record model, provider, rubric version, case id, and randomized pairwise order in the result
  manifest.
- Keep judge outputs under ignored `evals/results/<run-id>/` unless a human reviewer promotes a
  redacted summary.

## Files

- `technical-design-rubric.md` - criteria for semantic design quality.
- `pairwise.prompt.md` - prompt template for pairwise regression comparisons.
- `promptfooconfig.yaml` - manual Promptfoo wiring template.
