# DDD Eval - Unsourced Invariant Operand

## Defect

The invariant says "requested workspace must be inside the approved workspace root" but the matrix
only sources `request.workspacePath`; it does not name the approved root source.

## Expected review finding

- `lens`: `domain-correctness`
- `dimension`: `invariant`
- `severity`: `blocking`
- `lesson_ref`: `LSN-007`
- Required fix: name both operands as declared fields, events, projections, or resolver outputs.
