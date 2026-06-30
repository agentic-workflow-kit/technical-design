---
name: frame-technical-design
description: 'Use when a user asks to design a technical solution, architecture, or system and the problem must be framed before authoring. Reads source docs and current technical surfaces first, then produces a DDD-first problem frame with source map, assumptions, blockers, bounded-context candidates, complexity drivers, and selected DDD depth.'
---

# frame-technical-design

Frame the design problem before authoring. This is the divergent intake phase. It reduces ambiguity by
reading source artifacts and current implementation surfaces before asking questions.

## References

- Active methodology profile: `../../methodologies/ddd/README.md`
- DDD depth ladder: `../../docs/design/altitude-ladder.md`
- Problem frame template: `templates/problem-frame.md`
- Lessons ledger: `../../docs/design/lessons-ledger.md`

## Step 0 - Show the flow

Before drafting, show the assumed flow:

```text
I will do: read inputs and source surfaces -> build source map -> record safe assumptions and blockers -> identify DDD context candidates and complexity drivers -> select initial ddd_depth -> write problem-frame.md -> suggest author-technical-design.
```

## Step 1 - Ingest source before asking

Read the user-supplied brief, PRD, technical notes, existing design, and any nearby repo docs or source
surfaces that define the relevant behavior. Prefer source-of-truth artifacts over memory or prior
conversation summaries.

Output a **source map** with:

- source path or identifier;
- what it establishes;
- missing or stale facts;
- whether it is authoritative, supporting, or background.

## Step 2 - Identify DDD context candidates

List candidate bounded contexts or context areas. For each, state:

- owns;
- reads;
- does not own;
- likely public surface;
- unclear ownership, if any.

Do not invent ownership to make the frame complete. Mark it as a blocker if ownership changes the
design.

## Step 3 - Analyze complexity and depth

Identify complexity drivers:

- invariants and relational predicates;
- state transitions and lifecycle rules;
- external integrations and anti-corruption needs;
- consistency, idempotency, audit, replay, or event-history needs;
- security, tenancy, authorization, and fail-closed needs;
- migration/deploy, observability, and testing constraints.

Select an initial `ddd_depth`:

- `strategic-only`;
- `use-case-slices`;
- `ports-and-adapters`;
- `tactical-ddd`.

DDD is the default methodology. Tactical DDD depth still needs evidence.

## Step 4 - Ask and assume

Ask only blocking questions: questions whose answers would change ownership, context boundaries,
data/query design, consistency, migration/deploy, security, observability, or test strategy.

For reasonable defaults, record safe assumptions instead of interrupting the user.

## Step 5 - Output artifact

Write `problem-frame.md` using `templates/problem-frame.md`. It must include:

- source map;
- goal and out of scope;
- safe assumptions and blockers;
- DDD context candidates;
- complexity drivers;
- selected initial `ddd_depth`;
- handoff notes for `author-technical-design`.
