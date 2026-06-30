# Product-to-Design Cases

Cases are self-contained fixtures for deterministic product-to-design grading. They must not depend on
live fetches, private repository facts, or private product names.

## Case Layout

```text
fixtures/cases/<case-id>/
  product.md
  source-map.md
  reference-design.md
  expected-facts.json
  expected-boundaries.json
  rubric.md
  grader-notes.md
  provenance.md
```

## Rules

- Source facts must appear in `product.md` or `source-map.md`.
- `reference-design.md` is a comparison anchor, not the only valid answer.
- `expected-facts.json` and `expected-boundaries.json` must cite source IDs.
- Boundary fixtures may declare `accepted_alternatives` for source-equivalent ownership evidence.
- Deterministic checks should grade explicit facts, boundaries, and contradictions, not prose style.
- Generated outputs belong under ignored `internal/evals/results/<run-id>/`.
- Do not add external text unless its license allows committed fixtures and `provenance.md` records it.
