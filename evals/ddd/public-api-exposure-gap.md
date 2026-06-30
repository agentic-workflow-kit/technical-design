# DDD Eval - Public API Exposure Gap

## Defect

The design says downstream code imports `PaymentGatewayPort`, but it does not name the public export
surface or an import test. The only path shown is an internal module path.

## Expected review finding

- `lens`: `architecture-enforceability`
- `dimension`: `public-api`
- `severity`: `recommended`
- `lesson_ref`: `LSN-004`
- Required fix: name the public surface and add an import proof or manual exposure checklist.
