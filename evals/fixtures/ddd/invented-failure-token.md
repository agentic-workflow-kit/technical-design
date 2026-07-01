# DDD Eval - Invented Failure Token

## Defect

A consumer use case handles `subscription-force-cancel-forbidden`, but no producer-owned failure
catalog or prior design section defines that token.

## Expected review finding

- `lens`: `domain-correctness`
- `dimension`: `failure`
- `severity`: `blocking`
- `lesson_ref`: `LSN-003`
- Required fix: cite the producer-owned catalog or add the token to the owning context before consumers
  use it.
