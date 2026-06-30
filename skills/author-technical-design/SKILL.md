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
- Main DDD template: `../../methodologies/ddd/templates/technical-design.md`
- Bounded context template: `../../methodologies/ddd/templates/bounded-context.md`
- Enforcement map template: `../../methodologies/ddd/templates/enforcement-map.md`
- Decision format: `templates/decisions.md`
- Lessons ledger: `../../docs/design/lessons-ledger.md`

## Step 1 - Ingest context

Read `problem-frame.md`, the user brief/PRD/design notes, and any source artifacts named in the frame.
Do not ask questions already answered by those sources. Preserve the frame's blockers and safe
assumptions.

## Step 2 - Select DDD depth

Use the frame's initial `ddd_depth`, then confirm it against the evidence:

- `strategic-only` for simple work that still needs language and ownership clarity;
- `use-case-slices` for procedural behavior with explicit commands/errors/tests;
- `ports-and-adapters` when the domain must be isolated from concrete infrastructure;
- `tactical-ddd` when aggregates, value objects, domain events, and transaction boundaries are needed.

Record why the chosen depth is sufficient and where deeper tactical ceremony is intentionally omitted.

## Step 3 - Draft the design

Use the DDD template. The design must include:

1. Frontmatter: `methodology: ddd`, `methodology_version`, `design_status`, `ddd_depth`, `round`.
2. Source and context audit.
3. Assumptions and blockers.
4. Context map with owns/reads/does-not-own.
5. Ubiquitous language.
6. Commands/use cases and domain behavior.
7. Invariant and state matrix with sourced operands.
8. Ports, adapters, public APIs, and dependency direction.
9. Data/query/consistency model.
10. Failure, observability, migration, and deploy surfaces.
11. Testing and enforcement map.
12. Delivery inputs: story areas, sequencing constraints, file contention, validation expectations,
    and stop conditions.
13. Risks and deferred decisions.

## Step 4 - Seed decisions log

Create `decisions.md` from `templates/decisions.md` if it does not exist. If the design already has a
decision log, append only; do not rewrite history.

## Step 5 - Self-review gate

Before finalizing, check:

- Every context has owns/reads/does-not-own.
- Every invariant names concrete operands or states that come from declared sources.
- Every failure token, state, event, or public field has one owner.
- Every enforceable boundary has an enforcement-map rule and seeded violation.
- Every non-enforceable rule is called out as manual review or test strategy.
- Delivery inputs are concrete enough for later planning without adding scope.

If any check fails, revise before handing off to `review-technical-design`.

## Update mode

When invoked with accepted review suggestions:

1. Read the suggestion, user disposition, and decision entry.
2. Apply only accepted decisions.
3. Bump `round`.
4. Update the affected design section, enforcement map, delivery inputs, or risk list.
5. Do not close rejected or deferred suggestions; keep them visible through the decision log and risks.
