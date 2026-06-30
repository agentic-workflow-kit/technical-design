# DDD Eval - Vacuous Enforcement

## Defect

The design declares `domain -> infrastructure` forbidden, but the enforcement map has no
`seededViolation` and no command that proves the rule fails.

## Expected review finding

- `lens`: `architecture-enforceability`
- `dimension`: `enforceability`
- `severity`: `blocking`
- `lesson_ref`: `LSN-005`
- Required fix: add a seeded violation fixture and run the architecture gate to show the expected
  failure.
