# Suggestion Format Specification

`review-technical-design` emits structured suggestions and a human-readable report. Suggestions are
never edits. They become design changes only after the user disposes them and the decision is recorded.

## Required fields

- `id` - stable suggestion id such as `S-001`.
- `title` - short human-readable summary for reports and dispositions.
- `severity` - `blocking`, `recommended`, or `optional`.
- `lens` - `architecture-enforceability`, `domain-correctness`, or `agreement-integrity`.
- `dimension` - source map, input resolution, system model, docs structure, diagram, approval status,
  bounded context, invariant, boundary, public API, consistency, failure, enforceability, delivery
  inputs, or another schema dimension.
- `location` - design section, source path, use case, or boundary.
- `evidence` - the specific design/source evidence supporting the finding.
- `finding` - what is wrong or missing.
- `proposed_fix` - concrete fix, not automatically applied.
- `rationale` - why it matters.
- `gate_ref` - rubric, gate, enforcement rule, or standing check that should catch recurrence.
- `lesson_ref` - `LSN-###` from `docs/design/lessons-ledger.md`, or `none`.
- `status` - starts as `open`.
- `decision_ref` - starts as `""`, then points to `D-###` after the user disposes the suggestion.

## Disposition and convergence

- Suggestions are born with `status: open` and `decision_ref: ""`.
- Status changes only by user disposition: `accepted`, `rejected`, or `deferred`.
- Every disposition must have a `decisions.md` entry.
- A design is settled only when zero `blocking` suggestions remain open.
