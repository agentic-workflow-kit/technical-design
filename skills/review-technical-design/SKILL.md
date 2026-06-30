---
name: review-technical-design
description: 'Use when a user wants to review a technical design, check an architecture, review a DDD design, or run review-technical-design. Emits structured suggestions without auto-editing, using architecture/enforceability and domain-correctness lenses. Requires user disposition before design edits and treats settled as zero open blocking suggestions.'
---

# review-technical-design

Review a technical design without editing it. Emit structured suggestions and a human-facing report.
The user disposes suggestions; accepted items are then applied through `author-technical-design`
update mode and recorded in `decisions.md`.

## References

- Active DDD profile: `../../methodologies/ddd/README.md`
- DDD review rubric: `../../methodologies/ddd/review-rubric.md`
- Lessons ledger: `../../docs/design/lessons-ledger.md`
- Suggestion schema: `templates/suggestion.schema.json`
- Report template: `templates/review-report.md`

## Step 0 - Show the flow

Before reviewing, show the assumed flow:

```text
I will do: read design and profile -> review architecture/enforceability -> review domain correctness -> emit structured suggestions with evidence -> present report -> wait for user dispositions.
```

## Step 1 - Read inputs

Read the design, its decision log if present, the active methodology profile, and source artifacts the
design cites. Do not rely on the design's own "ready" claims without reconstructing them from sections,
tables, enforcement maps, and cited sources.

## Step 2 - Architecture and enforceability lens

Check:

- contexts have owns/reads/does-not-own;
- dependency direction is explicit;
- public APIs have export/import evidence or tests;
- enforceable boundaries have seeded violations and standing gates;
- manual-only rules are not misrepresented as static enforcement;
- delivery inputs do not hand scope decisions to implementers.

## Step 3 - Domain-correctness lens

Check:

- ubiquitous language is consistent;
- commands/use cases name guarded invariants;
- relational predicates source every operand;
- failure tokens, states, events, and fields have one owner;
- lifecycle transitions name the authority for prior state;
- tactical DDD depth is neither too light nor too heavy for each context.

## Step 4 - Draft structured suggestions

For each issue, create a suggestion matching `templates/suggestion.schema.json`.

Required fields include:

- `lens`: `architecture-enforceability` or `domain-correctness`;
- `evidence`: design section, source artifact, or code surface;
- `gate_ref`: rubric, gate, enforcement rule, or standing check that should catch recurrence;
- `lesson_ref`: lesson id from `docs/design/lessons-ledger.md` when applicable;
- `decision_ref`: empty until user disposition.

Always populate over-engineering and under-engineering flags, even when empty.

## Step 5 - Present report and wait

Render `templates/review-report.md`. The report must show:

- verdict: `settled` or open counts;
- both review lenses;
- over/under-engineering flags;
- suggestion table;
- disposition instruction.

Do not edit the design. Wait for the user's `fix`, `reject`, or `defer` disposition with rationale.

## Step 6 - Convergence rule

The design is settled only when no `blocking` suggestion is `open`. Previously rejected or deferred
items remain recorded and are not re-raised unless the design changed in a way that reopens them.
