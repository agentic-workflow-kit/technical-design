---
name: orchestrate-technical-design
description: 'Use when a user wants to run the full technical design process hands-off or orchestrate part of it. Reads and applies inputs -> system-model -> structure -> author -> diagrams -> review loop -> enforce, uses the active DDD methodology profile, pauses for approvals/dispositions, stops at the requested boundary, and does not reimplement skill logic.'
compatibility: 'Orchestrates by sequentially reading and applying instructions from sibling skill files.'
---

# orchestrate-technical-design

Run the `technical-design` process as a composition-only runbook. Do not invent scope, methodology
rules, or enforcement behavior. Read the sibling skill instructions and the active methodology profile
at each stage.

## References

- Active methodology profile: `../../methodologies/ddd/README.md`
- Methodology profile contract: `../../docs/design/methodology-profile-contract.md`
- Lessons ledger: `../../docs/design/lessons-ledger.md`

## Flow

1. **Identify stop boundary.** Supported boundaries: `inputs`, `system-model`, `structure`,
   `author`, `diagrams`, `review`, `enforce`.
2. **Inputs.** Read and apply `../frame-technical-design/SKILL.md`; produce the source map and
   `InputResolution`.
3. **System model.** Continue `frame-technical-design`; produce `AgreedSystemModel`,
   `architecture_mode`, initial `ddd_depth`, blockers, and approval status. Stop if required
   approvals are pending.
4. **Structure.** Read and apply `../author-technical-design/SKILL.md`; produce `DocStructurePlan`
   and stop if structure approval is pending.
5. **Author.** Continue `author-technical-design`; produce the DDD-first design and `decisions.md`
   only after approval gates are satisfied.
6. **Diagrams.** Add diagrams only when useful, and only to explain approved entities, flows,
   lifecycles, or boundaries.
7. **Review loop.**
   - Read and apply `../review-technical-design/SKILL.md`.
   - Present the report and wait for user dispositions.
   - Record dispositions in `decisions.md`.
   - Apply accepted suggestions through author update mode.
   - Repeat until no blocking suggestion is open.
8. **Enforce.** Read and apply `../enforce-architecture/SKILL.md`; generate rules only from the
   settled enforcement map and prove seeded violations fail.

## Stop conditions

Stop and report when:

- the requested boundary has been reached;
- `InputResolution`, `AgreedSystemModel`, or `DocStructurePlan` requires approval;
- a blocking question remains unanswered;
- diagrams would introduce architecture without a recorded decision;
- a design or review tries to hand implementation scope decisions to a later executor;
- an enforcement rule lacks a seeded violation;
- the active methodology profile is missing required profile files.

## Final summary

At every boundary, report:

- artifact produced;
- unresolved blockers;
- assumptions needing approval;
- whether user approval is required before continuing.

In the final summary, report the produced artifacts, open blockers, accepted/deferred/rejected
decisions, enforcement status, and verification commands run.
