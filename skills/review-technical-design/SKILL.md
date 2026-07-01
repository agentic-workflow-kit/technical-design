---
name: review-technical-design
description: 'Use when a user wants to review a technical design, check an architecture, review a DDD design, or run review-technical-design. Emits structured suggestions without auto-editing, using architecture/enforceability, domain-correctness, and agreement-integrity lenses. Requires user disposition before design edits and treats settled as zero open blocking suggestions.'
---

# review-technical-design

Review a technical design without editing it. Emit structured suggestions and a human-facing report.
The user disposes suggestions; accepted items are then applied through `author-technical-design`
update mode and recorded in `decisions.md`.

## References

- Active DDD profile: `../../methodologies/ddd/README.md`
- Planner handoff contract: `../../docs/design/technical-design-handoff-contract.md`
- DDD review rubric: `../../methodologies/ddd/review-rubric.md`
- Lessons ledger: `../../docs/design/lessons-ledger.md`
- Suggestion schema: `templates/suggestion.schema.json`
- Report template: `templates/review-report.md`

## Step 0 - Show the flow

Before reviewing, show the assumed flow:

```text
I will do: read design, approvals, and profile -> review architecture/enforceability -> review domain correctness -> review agreement integrity -> emit structured suggestions with evidence -> present report -> wait for user dispositions.
```

## Step 1 - Read inputs

Read the design, `InputResolution`, `AgreedSystemModel`, `DocStructurePlan`, its decision log if
present, the active methodology profile, and source artifacts the design cites. Do not rely on the
design's own "ready" claims without reconstructing them from sections, tables, approval status,
enforcement maps, and cited sources.

## Step 2 - Architecture and enforceability lens

Check:

- contexts have owns/reads/does-not-own;
- dependency direction is explicit;
- public APIs have export/import evidence or tests;
- enforceable boundaries have seeded violations and standing gates;
- manual-only rules are not misrepresented as static enforcement;
- the `Planner Handoff Summary` names, or explicitly marks `None` with source-backed rationale,
  every required handoff category: `SRC`, `CTX`, `INV`, `SURF`, `FAIL`, `OBS`, `ENF`, `DEL`,
  `SEQ`, `FILE`, `VAL`, and `STOP`;
- required handoff categories are not blank, prose-only, unchecked, or `TBD`;
- delivery inputs do not hand scope decisions to implementers.

## Step 3 - Domain-correctness lens

Check:

- ubiquitous language is consistent;
- commands/use cases name guarded invariants;
- relational predicates source every operand;
- failure tokens, states, events, and fields have one owner;
- lifecycle transitions name the authority for prior state;
- tactical DDD depth is neither too light nor too heavy for each context.

## Step 4 - Agreement-integrity lens

Check:

- `InputResolution` exists and no unresolved `requires approval` or `blocked` item leaks into
  planner-ready facts;
- `AgreedSystemModel` is approved before authoring;
- `DocStructurePlan` is approved and authored files match its responsibilities;
- authored docs do not introduce entities, seams, lifecycle states, public surfaces, or planner facts
  absent from the approved system model or decision log;
- diagrams trace to approved entities, flows, lifecycles, or boundaries and do not change
  architecture without a decision;
- overview diagrams stay at skeleton altitude and do not duplicate detail the child document owns;
  no arrow implies a flow the system does not perform;
- `Planner Handoff Summary` facts do not contradict the approved system model.

Blocking findings include missing approval artifacts, unapproved architecture additions, or planner
handoff facts that contradict the approved model.

## Step 5 - Draft structured suggestions

For each issue, create a suggestion matching `templates/suggestion.schema.json`.

Required fields include:

- `title`: short human-readable summary for reports and dispositions;
- `lens`: `architecture-enforceability`, `domain-correctness`, or `agreement-integrity`;
- `evidence`: design section, source artifact, or code surface;
- `gate_ref`: rubric, gate, enforcement rule, or standing check that should catch recurrence;
- `lesson_ref`: lesson id from `docs/design/lessons-ledger.md` when applicable;
- `status`: `open` when the suggestion is created;
- `decision_ref`: `""` until user disposition, then the `D-###` decision entry.

Always populate over-engineering and under-engineering flags, even when empty.

## Step 6 - Present report and wait

Render `templates/review-report.md`. The report must show:

- verdict: `settled` or open counts;
- all three review lenses;
- over/under-engineering flags;
- suggestion table with each required schema field needed for human disposition, including `title`,
  `status`, and `decision_ref`;
- disposition instruction.

Do not edit the design. Wait for the user's `fix`, `reject`, or `defer` disposition with rationale.

## Step 7 - Convergence rule

The design is settled only when no `blocking` suggestion is `open`. Previously rejected or deferred
items remain recorded and are not re-raised unless the design changed in a way that reopens them.
