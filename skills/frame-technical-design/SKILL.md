---
name: frame-technical-design
description: 'Use when a user asks to design a technical solution, architecture, or system and the problem must be framed before authoring. Reads source docs and current technical surfaces first, resolves required inputs, proposes an approved system model, selects architecture_mode and initial DDD depth, and stops before durable design docs.'
---

# frame-technical-design

Frame the design problem before authoring. This is the divergent intake phase. It reduces ambiguity by
reading source artifacts and current implementation surfaces, resolving required inputs, and exposing
the high-level system model for approval before durable design docs exist.

## References

- Active methodology profile: `../../methodologies/ddd/README.md`
- DDD depth ladder: `../../docs/design/altitude-ladder.md`
- Problem frame template: `templates/problem-frame.md`
- Input resolution template: `templates/input-resolution.md`
- System model template: `templates/system-model.md`
- Lessons ledger: `../../docs/design/lessons-ledger.md`

## Step 0 - Show the flow

Before drafting, show the assumed flow:

```text
I will do: read inputs and source surfaces -> build source map -> produce InputResolution -> select architecture_mode and initial ddd_depth -> propose AgreedSystemModel -> stop for approval before author-technical-design.
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

## Step 2 - Resolve required inputs

Create `InputResolution` for every product or idea input that can change context ownership,
boundaries, invariants, public APIs, lifecycle authority, data ownership, enforcement, or delivery
slicing.

Classify each required input as:

- `provided` - explicit source evidence exists.
- `safe assumption` - the source leaves a gap, but only one narrow choice is viable; cite source
  evidence and risk.
- `requires approval` - more than one plausible choice would change ownership, boundaries, invariant
  authority, API scope, lifecycle transitions, enforcement, or delivery slicing.
- `blocked` - the design cannot responsibly proceed until the user or source owner answers.

Ask only blocking questions. For reasonable defaults, record safe assumptions instead of
interrupting the user.

## Step 3 - Analyze complexity and mode/depth

Identify complexity drivers:

- invariants and relational predicates;
- state transitions and lifecycle rules;
- external integrations and anti-corruption needs;
- consistency, idempotency, audit, replay, or event-history needs;
- security, tenancy, authorization, and fail-closed needs;
- migration/deploy, observability, and testing constraints.

Select an `architecture_mode`:

- `system-entity-model`;
- `lifecycle/state-machine`;
- `ports-and-adapters`;
- `control-plane/runtime`;
- `contract/seam design`;
- `strategic-ddd`;
- `tactical-ddd`.

Then select an initial `ddd_depth`:

- `strategic-only`;
- `use-case-slices`;
- `ports-and-adapters`;
- `tactical-ddd`.

DDD is the default methodology. `architecture_mode` decides the first useful lens; tactical DDD depth
still needs evidence.

## Step 4 - Propose the system model

Create `AgreedSystemModel` before context maps or durable docs. It must include:

- source inputs used;
- unresolved required inputs;
- high-level system entities;
- responsibilities per entity;
- relations between entities;
- ownership / reads / does-not-own;
- seams and external boundaries;
- lifecycle/state terms;
- `architecture_mode`;
- initial `ddd_depth`;
- open questions;
- approval status.

Do not invent ownership to make the model complete. If a choice changes architecture, mark it
`requires approval` or `blocked`.

## Step 5 - Identify context candidates

List candidate bounded contexts or context areas. For each, state:

- owns;
- reads;
- does not own;
- likely public surface;
- unclear ownership, if any.

Use context candidates as a DDD projection of the system model, not as the first architecture shape.
If a candidate context introduces an entity, seam, or lifecycle term that is not in the system model,
mark it as an open question.

## Step 6 - Output artifacts

Write `problem-frame.md` using `templates/problem-frame.md`. It must include:

- source map;
- goal and out of scope;
- `InputResolution`;
- `AgreedSystemModel`;
- safe assumptions and blocking questions;
- DDD context candidates;
- complexity drivers;
- selected `architecture_mode`;
- selected initial `ddd_depth`;
- approval status;
- handoff notes for `author-technical-design`.

Stop before `author-technical-design` when any required input or system-model decision is
`requires approval` or `blocked`.
