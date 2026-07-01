# DDD Eval - Proof-Substrate Mismatch

## Defect

The design claims `95% branch coverage` proves a public type-only catalog, but the planned standing
gate is a runtime coverage command over erased type declarations. No compile fixture, public-import
test, or catalog assertion is named.

## Expected review finding

- `lens`: `architecture-enforceability`
- `dimension`: `enforceability`
- `severity`: `blocking`
- `lesson_ref`: `LSN-019`
- Required fix: name the proof substrate that the standing gate actually exercises for each
  validation, coverage, or enforcement claim.

