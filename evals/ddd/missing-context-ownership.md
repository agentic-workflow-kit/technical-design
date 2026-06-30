# DDD Eval - Missing Context Ownership

## Defect

A design names `Billing` and `Subscription` but does not say which context owns cancellation policy.

## Expected review finding

- `lens`: `domain-correctness`
- `dimension`: `bounded-context`
- `severity`: `blocking`
- `lesson_ref`: `LSN-001`
- Required fix: add owns/reads/does-not-own and route cross-context policy through a public surface.
