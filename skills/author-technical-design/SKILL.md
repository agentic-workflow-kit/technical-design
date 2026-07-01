---
name: author-technical-design
description: 'Use when the user wants to write or update a technical design document from an approved problem frame and system model. Requires approved InputResolution and AgreedSystemModel, proposes DocStructurePlan before durable docs, then produces a DDD-first, technical-solution-compatible design and decisions log.'
---

# author-technical-design

Author or update a DDD-first technical design. The design must be useful to a human reviewer,
checkable by a later agent, and detailed enough to feed delivery planning without letting the
implementer invent domain scope. Do not write durable design docs until `InputResolution`,
`AgreedSystemModel`, and `DocStructurePlan` are approved or the user explicitly scopes the run as a
draft-only pass.

## References

- Active methodology profile: `../../methodologies/ddd/README.md`
- Planner handoff contract: `../../docs/design/technical-design-handoff-contract.md`
- Canonical DDD design template: `../../methodologies/ddd/templates/technical-design.md`
- Bounded context template: `../../methodologies/ddd/templates/bounded-context.md`
- Enforcement map template: `../../methodologies/ddd/templates/enforcement-map.md`
- Docs structure template: `templates/design-doc-structure.md`
- Decision format: `templates/decisions.md`
- Lessons ledger: `../../docs/design/lessons-ledger.md`

## Step 1 - Ingest context

Read `problem-frame.md`, `InputResolution`, `AgreedSystemModel`, the user brief/PRD/design notes, and
any source artifacts named in the frame. Do not ask questions already answered by those sources.
Preserve the frame's blockers, safe assumptions, `architecture_mode`, and initial `ddd_depth`.

## Step 2 - Resolve required inputs and verify approval gates

`frame-technical-design` owns `InputResolution`; `author-technical-design` verifies it before
drafting. Treat `InputResolution` as the design's `Input Sufficiency and Ownership Resolution`
surface.

Before drafting, verify:

- every required input that can change context ownership, boundaries, invariants, public APIs,
  lifecycle authority, data ownership, enforcement, or delivery slicing is classified in
  `InputResolution`;
- no item remains `requires approval` or `blocked` unless the user explicitly asks for draft-only
  output and the affected planner facts stay out of the ready-for-planning contract;
- `AgreedSystemModel` includes approved entities, responsibilities, relations, ownership,
  seams/external boundaries, lifecycle/state terms, `architecture_mode`, initial `ddd_depth`, and
  approval status.
- the required product inputs cover product goal/non-goals; producer-owned facts, data, and
  behavior; context owns/reads/does-not-own; invariant operands and owning authority; lifecycle states
  and transition authority; public APIs, ports, events, and commands; failure tokens and recovery
  authority; consistency, concurrency, and idempotency needs; observability; enforcement gates; and
  delivery stop conditions.

If approval is missing, ask the user for the specific approval or stop with `Blocking Questions`
instead of drafting around it. The design must not invent ownership from missing input. When sources
name an aggregate, domain service, workflow service, or service candidate, either give it explicit
ownership treatment in the approved model or state why it remains an internal sub-boundary inside a
larger context.

## Step 3 - Propose docs structure

Create `DocStructurePlan` using `templates/design-doc-structure.md`. It must include:

- agreed system-model source;
- proposed docs tree;
- responsibility of each file;
- why this shape fits the system model;
- what stays out;
- status per file: overview, stub, contract, decision-log, or archive;
- approval status.

Stop for approval when the docs tree or file responsibilities are not already approved. The default
for small designs is one `technical-design.md` plus `decisions.md`; multi-doc structures are used
when separate overview, contract, lifecycle, or decision surfaces make review clearer.

## Step 4 - Confirm mode and DDD depth

Use the frame's `architecture_mode` and initial `ddd_depth`, then confirm them against the evidence.
Allowed `architecture_mode` values are:

- `system-entity-model`;
- `lifecycle/state-machine`;
- `ports-and-adapters`;
- `control-plane/runtime`;
- `contract/seam design`;
- `strategic-ddd`;
- `tactical-ddd`.

Allowed `ddd_depth` values are:

- `strategic-only` for simple work that still needs language and ownership clarity;
- `use-case-slices` for procedural behavior with explicit commands/errors/tests;
- `ports-and-adapters` when the domain must be isolated from concrete infrastructure;
- `tactical-ddd` when aggregates, value objects, domain events, and transaction boundaries are needed.

Record why the chosen mode and depth are sufficient and where deeper tactical ceremony is intentionally
omitted.

## Step 5 - Draft the design

Use the canonical DDD design template from `../../methodologies/ddd/templates/technical-design.md`.
The skill-local `templates/design-doc.md` file is only an alias to that canonical template. The design
must include:

1. Frontmatter: `design_id`, `handoff_contract: technical-design-handoff-v0`,
   `methodology: ddd`, `methodology_version`, `architecture_mode`, `design_status`, `ddd_depth`,
   `round`.
2. Planner Handoff Summary with stable source, context/boundary, invariant, API/surface, failure,
   observability, enforcement, delivery, sequencing, file-contention, validation, and stop-condition
   IDs.
3. Pre-authoring approval record for `InputResolution`, `AgreedSystemModel`, and `DocStructurePlan`.
4. Source and context audit.
5. Assumptions and blockers.
6. Context map with owns/reads/does-not-own.
7. Ubiquitous language.
8. Commands/use cases and domain behavior.
9. Invariant and state matrix with sourced operands.
10. Ports, adapters, public APIs, and dependency direction.
11. Data/query/consistency model.
12. Source and producer closure for public surfaces, produced records, failure tokens,
    observability events, catalog values, and other shapes a later planner or implementer must
    preserve.
13. Failure, observability, migration, and deploy surfaces.
14. Diagrams when useful, tracing only approved entities, flows, lifecycles, or boundaries.
15. Testing and enforcement map with proof-substrate labels for runtime tests, type/compile
    fixtures, static rules, seeded negatives, documentation review, or manual-only review.
16. Delivery inputs: story areas, sequencing constraints, file contention, validation expectations,
    and stop conditions.
17. Risks and deferred decisions.

## Step 6 - Seed decisions log

Create `decisions.md` from `templates/decisions.md` if it does not exist. If the design already has a
decision log, append only; do not rewrite history.

## Step 7 - Self-review gate

Before finalizing, check:

- Required input gaps are resolved as source-backed safe assumptions, user-approved decisions, or
  explicit Blocking Questions; the design must not invent ownership from missing input.
- Authored sections trace to `AgreedSystemModel`; new entities, seams, lifecycle states, or diagrams
  are recorded as accepted decisions before they appear as architecture.
- `DocStructurePlan` explains why each durable file exists and what stays out.
- Every context has owns/reads/does-not-own.
- Every source-named aggregate, domain service, workflow service, or service candidate has explicit
  ownership treatment, or is recorded as an internal sub-boundary whose owning context is named.
- Every invariant names concrete operands or states that come from declared sources.
- Every planner-facing fact has direct or transitive source closure to visible product, design,
  source, or decision evidence and does not depend on hidden prior art or DDD-only vocabulary.
- Every failure token, state, event, observability record, catalog value, produced field, or public
  symbol has one producer/source authority and a closure proof.
- Every enforceable boundary has an enforcement-map rule and seeded violation.
- Every non-enforceable rule is called out as manual review or test strategy.
- Every validation, coverage, and enforcement claim names the proof substrate the standing gate
  actually exercises.
- The Planner Handoff Summary distinguishes required handoff facts from DDD-specific detail and is
  concrete enough for later planning without adding scope.

If any check fails, revise before handing off to `review-technical-design`.

## Update mode

When invoked with accepted review suggestions:

1. Read the suggestion, user disposition, and decision entry.
2. Apply only accepted decisions.
3. Bump `round`.
4. Update the affected input resolution, system model, docs structure, design section, enforcement
   map, delivery inputs, or risk list.
5. Do not close rejected or deferred suggestions; keep them visible through the decision log and risks.
