# DDD Review Rubric

Review every DDD design with three lenses.

## Lens 1 - Architecture and Enforceability

Blocking findings:

- A context has dependencies but no owns/reads/does-not-own statement.
- A domain or application layer imports concrete persistence, provider SDKs, delivery framework code,
  or another context's internals.
- A public API is promised in prose but no public export/import surface or import test is named.
- A planner-facing fact lacks direct or transitive source closure to a visible product, design, source, or decision reference and can only be justified from hidden context or methodology-private prose.
- A public surface, produced record, failure token, observability event, or catalog value lacks a single producer/source authority.
- An enforcement rule has no seeded violation or standing gate.
- A validation, coverage, or enforcement claim does not name the proof substrate that the standing gate actually exercises.
- A proof claim relies only on a manual spot check when the design claims durable enforcement.
- A design marks ready for planning without a `Planner Handoff Summary` that names, or explicitly marks `None` with source-backed rationale, every required handoff category: `SRC`, `CTX`, `INV`, `SURF`, `FAIL`, `OBS`, `ENF`, `DEL`, `SEQ`, `FILE`, `VAL`, and `STOP`.
- A required handoff category is blank, prose-only, unchecked, or `TBD`.

Recommended findings:

- Boundary rules are enforceable but not named in a reusable enforcement map.
- Testing does not distinguish runtime tests, type tests, static checks, and manual review.
- Observability does not name the event, metric, audit record, or log shape needed for operations.
- Review suggestions cite hidden prior-art context instead of visible product, design, source, or
  current code evidence.
- Planner handoff facts exist but are duplicated inconsistently between the handoff summary and
  methodology-specific sections.

## Lens 2 - Domain Correctness

Blocking findings:

- A command mutates state without naming the invariant it guards.
- A relational predicate names only one operand or uses a category instead of declared fields/events.
- A consumer invents a failure token, state, event type, or field that no producer owns.
- A lifecycle transition is allowed without a source of authority for the prior state.
- A cross-context decision blurs ownership instead of routing through a port, event, or explicit API.
- A design assigns context ownership, lifecycle authority, public API scope, or invariant authority from missing product inputs without a safe assumption, blocking question, or accepted user decision.

Recommended findings:

- Ubiquitous language has synonyms that can lead to duplicate concepts.
- Tactical DDD is too heavy for a strategic-only context.
- Tactical DDD is too light for a context with strict invariants or lifecycle rules.

## Lens 3 - Agreement Integrity

Blocking findings:

- A design lacks approved `InputResolution`, `AgreedSystemModel`, or `DocStructurePlan`.
- A planner-ready fact depends on a required input still marked `requires approval` or `blocked`.
- Authored docs introduce an entity, seam, lifecycle state, public surface, or planner-facing fact
  that is absent from the approved system model and decision log.
- The docs tree or file responsibilities contradict the approved `DocStructurePlan`.
- A diagram changes architecture instead of explaining approved entities, flows, lifecycles, or
  boundaries.
- An overview diagram duplicates detail a child document owns, or an arrow implies a flow the system
  does not perform.
- The `Planner Handoff Summary` contradicts the approved system model.

Recommended findings:

- Approval status exists but is hard to cite from the handoff summary.
- Diagrams are correct but lack a sentence tying them to the approved model.
- The docs structure is approved but does not explain what stays out.

## Suggestion requirements

Every suggestion must include:

- `title`: short human-readable summary for reports and dispositions.
- `lens`: `architecture-enforceability`, `domain-correctness`, or `agreement-integrity`.
- `evidence`: design section, source artifact, or source surface that supports the finding.
- `gate_ref`: the gate, rubric item, or enforcement rule that would catch recurrence.
- `lesson_ref`: a lesson id when the finding maps to `docs/design/lessons-ledger.md`.
- `status`: `open` when created.
- `decision_ref`: `""` until the user disposes the suggestion, then the `D-###` decision entry.
