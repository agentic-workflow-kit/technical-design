---
name: author-technical-design
description: 'Use when the user wants to write or update a technical design document from a problem frame, brief, PRD, or design notes. Produces a DDD-first, technical-solution-compatible design with methodology frontmatter, context map, ubiquitous language, invariants, use cases, ports/adapters, consistency, failure modes, enforcement map, delivery inputs, and decisions log.'
---

# author-technical-design

Author or update a DDD-first technical design. The design must be useful to a human reviewer,
checkable by a later agent, and detailed enough to feed delivery planning without letting the
implementer invent domain scope.

## References

- Active methodology profile: `../../methodologies/ddd/README.md`
- Planner handoff contract: `../../docs/design/technical-design-handoff-contract.md`
- Main DDD template: `../../methodologies/ddd/templates/technical-design.md`
- Bounded context template: `../../methodologies/ddd/templates/bounded-context.md`
- Enforcement map template: `../../methodologies/ddd/templates/enforcement-map.md`
- Decision format: `templates/decisions.md`
- Lessons ledger: `../../docs/design/lessons-ledger.md`

## Step 1 - Ingest context

Read `problem-frame.md`, the user brief/PRD/design notes, and any source artifacts named in the frame.
Do not ask questions already answered by those sources. Preserve the frame's blockers and safe
assumptions.

## Step 2 - Resolve required inputs

Before drafting, classify input sufficiency for every product or idea input that can change context
ownership, boundaries, invariants, public APIs, lifecycle authority, data ownership, enforcement, or
delivery slicing.

Use an `Input Sufficiency and Ownership Resolution` checklist in the Source and Context Audit or
Assumptions and Blockers section. Classify each required product input as one of:

- `provided` - explicit source evidence exists.
- `safe assumption` - the source leaves a gap, but only one narrow choice is viable; cite the source
  evidence and risk.
- `requires approval` - more than one plausible choice would change ownership, boundaries, invariant
  authority, API scope, lifecycle transitions, or delivery slicing.
- `blocked` - the design cannot responsibly proceed until the user or source owner answers.

The required product inputs include: product goal/non-goals; producer-owned facts, data, and behavior;
context owns/reads/does-not-own; invariant operands and owning authority; lifecycle states and
transition authority; public APIs, ports, events, and commands; failure tokens and recovery
authority; consistency, concurrency, and idempotency needs; observability; enforcement gates; and
delivery stop conditions.

If a required input is missing, do not invent a confident owner or boundary. Either record a
source-backed safe assumption, or ask the user for approval before drafting that decision. If the user
is not available, preserve it under `Blocking Questions` and keep the affected `CTX-*`, `INV-*`,
`SURF-*`, `FAIL-*`, `ENF-*`, `DEL-*`, or `STOP-*` fact out of the ready-for-planning contract.

## Step 3 - Select DDD depth

Use the frame's initial `ddd_depth`, then confirm it against the evidence:

- `strategic-only` for simple work that still needs language and ownership clarity;
- `use-case-slices` for procedural behavior with explicit commands/errors/tests;
- `ports-and-adapters` when the domain must be isolated from concrete infrastructure;
- `tactical-ddd` when aggregates, value objects, domain events, and transaction boundaries are needed.

Record why the chosen depth is sufficient and where deeper tactical ceremony is intentionally omitted.

## Step 4 - Draft the design

Use the DDD template. The design must include:

1. Frontmatter: `design_id`, `handoff_contract: technical-design-handoff-v0`,
   `methodology: ddd`, `methodology_version`, `design_status`, `ddd_depth`, `round`.
2. Planner Handoff Summary with stable source, context/boundary, invariant, API/surface, failure,
   observability, enforcement, delivery, sequencing, file-contention, validation, and stop-condition
   IDs.
3. Source and context audit.
4. Assumptions and blockers.
5. Context map with owns/reads/does-not-own.
6. Ubiquitous language.
7. Commands/use cases and domain behavior.
8. Invariant and state matrix with sourced operands.
9. Ports, adapters, public APIs, and dependency direction.
10. Data/query/consistency model.
11. Failure, observability, migration, and deploy surfaces.
12. Testing and enforcement map.
13. Delivery inputs: story areas, sequencing constraints, file contention, validation expectations,
    and stop conditions.
14. Risks and deferred decisions.

## Step 5 - Seed decisions log

Create `decisions.md` from `templates/decisions.md` if it does not exist. If the design already has a
decision log, append only; do not rewrite history.

## Step 6 - Self-review gate

Before finalizing, check:

- Required input gaps are resolved as source-backed safe assumptions, user-approved decisions,
  or explicit Blocking Questions; the design must not invent ownership from missing input.
- Every context has owns/reads/does-not-own.
- Every invariant names concrete operands or states that come from declared sources.
- Every failure token, state, event, or public field has one owner.
- Every enforceable boundary has an enforcement-map rule and seeded violation.
- Every non-enforceable rule is called out as manual review or test strategy.
- The Planner Handoff Summary distinguishes required handoff facts from DDD-specific detail and is
  concrete enough for later planning without adding scope.

If any check fails, revise before handing off to `review-technical-design`.

## Update mode

When invoked with accepted review suggestions:

1. Read the suggestion, user disposition, and decision entry.
2. Apply only accepted decisions.
3. Bump `round`.
4. Update the affected design section, enforcement map, delivery inputs, or risk list.
5. Do not close rejected or deferred suggestions; keep them visible through the decision log and risks.
