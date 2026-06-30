# Lessons Ledger

This ledger is the single home for recurring defect classes learned from prior technical-design and
delivery work. A lesson is useful only when it maps to a cover: a gate, rubric item, enforcement rule,
or eval. A lesson with no cover is an open production-readiness gap.

## Status values

- `covered` - a checkable gate, rubric item, enforcement rule, or eval covers the defect class.
- `conditional` - covered only when a named precondition holds.
- `open` - no cover exists yet; do not treat the pack as production-ready for that defect class.

## Ledger

| ID | Lesson | Cover | Status |
|---|---|---|---|
| LSN-001 | A coherent design can still seed ambiguous implementation work if context ownership is fuzzy. | DDD rubric: bounded context owns/reads/does-not-own; author template context map. | covered |
| LSN-002 | A design that says "as specified" is not checkable. | Principles: readiness is reconstructed; author template traceability tables. | covered |
| LSN-003 | Consumers must not invent fields, events, states, or failure tokens. | Review rubric: producer/source closure; DDD eval for invented failure token. | covered |
| LSN-004 | A public API can exist in prose but be missing from the actual import surface. | Review rubric: public exposure; eval for public API exposure gap. | covered |
| LSN-005 | Negative claims rot if they are not run by a standing gate. | Enforce skill: seeded violation per declared rule; enforce eval. | covered |
| LSN-006 | Coverage percentages over erased or type-only surfaces can pass vacuously. | Review rubric: proof substrate; author testing section distinguishes runtime, type, and doc proofs. | covered |
| LSN-007 | Relational predicates need both operands sourced, not named as a category. | Review rubric: invariant operand closure; DDD eval for unsourced invariant operand. | covered |
| LSN-008 | Broad sweeps can ban a design's own vocabulary and create false safety. | Review rubric: sweep vocabulary must cite design terms and allowed-owned tokens. | covered |
| LSN-009 | Orchestration must not re-derive scope that the planning/design artifact owns. | Orchestrator skill: composition-only; stop boundary; no methodology invention. | covered |
| LSN-010 | Lessons captured as prose drift under pressure. | This ledger: every lesson must map to a gate, rubric item, rule, or eval. | covered |

## Before adding a new lesson

Add a row only for a recurring defect class. Then add or cite the cover in the same change. If the
cover cannot be added yet, mark the lesson `open` and explain the accepted risk in the design or
release notes.
