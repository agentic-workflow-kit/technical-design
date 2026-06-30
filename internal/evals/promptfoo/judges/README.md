# Judge Evals

Judge evals are manual/model-graded until calibration proves they are reliable enough for release
signals. They must never override deterministic schema, source-fact, or enforcement failures.

## Rules

- Allow `unknown` when evidence is insufficient.
- Cite candidate and expected-fact evidence in every result.
- Do not reward length, familiar architecture vocabulary, or rhetorical confidence without source
  support.
- Record model, provider, rubric version, case id, and relevant run metadata in the result
  manifest. Pairwise runs must also record randomized order metadata.
- Keep judge outputs under ignored `internal/evals/results/<run-id>/` unless a human reviewer promotes a
  redacted summary.

## Files

- `technical-design-rubric.md` - criteria for semantic design quality.
- `pointwise.prompt.md` - prompt template for manual pointwise coverage judging against expected
  facts and boundaries.
- `pairwise.prompt.md` - prompt template for pairwise regression comparisons.
- `promptfooconfig.yaml` - manual Promptfoo wiring template.

## Usage

Run pointwise coverage judging before pairwise comparison:

```bash
pnpm --filter @agentic-workflow-kit/technical-design-evals eval:judge:coverage -- --case <case-id> --candidate <candidate.md> --model gpt-5.4 --provider openai --effort medium --run-id <run-id>-pointwise
```

Inputs:

- visible case sources: `product.md` and `source-map.md`;
- expected facts and boundaries;
- candidate design markdown.

Outputs:

- `pointwise-result.json` validated by `schemas/pointwise-judge-result.schema.json`;
- Promptfoo JSON and HTML exports;
- `manifest.json` and `report.md`.

Run pairwise comparison only after deterministic grading and pointwise findings are understood:

```bash
pnpm --filter @agentic-workflow-kit/technical-design-evals eval:judge -- --case <case-id> --candidate-a <candidate-a.md> --candidate-b <candidate-b.md> --model gpt-5.4 --provider openai --effort medium --seed <seed> --run-id <run-id>-pairwise
```

Pairwise inputs include both candidate designs, visible case sources, expected facts/boundaries,
the reference anchor when used as one candidate, and randomized order metadata. Pairwise outputs
include `pairwise-result.json`, Promptfoo exports, `manifest.json`, and `report.md`.
