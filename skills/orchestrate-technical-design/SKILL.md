---
name: orchestrate-technical-design
description: 'Use when a user wants to run the full technical design process hands-off or orchestrate part of it. Reads and applies frame -> author -> review loop -> enforce, uses the active DDD methodology profile, pauses for user dispositions, stops at the requested boundary, and does not reimplement skill logic.'
compatibility: 'Orchestrates by sequentially reading and applying instructions from sibling skill files.'
---

# orchestrate-technical-design

Run the `technical-design` process as a composition-only runbook. Do not invent scope, methodology
rules, or enforcement behavior. Read the sibling skill instructions and the active methodology profile
at each stage.

## References

- Active methodology profile: `../../methodologies/ddd/README.md`
- Methodology profile contract: `../../docs/methodology-profile-contract.md`
- Lessons ledger: `../../docs/lessons-ledger.md`

## Flow

1. **Identify stop boundary.** Supported boundaries: `frame`, `author`, `review`, `enforce`.
2. **Frame.** Read and apply `../frame-technical-design/SKILL.md`; produce `problem-frame.md`.
3. **Author.** Read and apply `../author-technical-design/SKILL.md`; produce the DDD-first design and
   `decisions.md`.
4. **Review loop.**
   - Read and apply `../review-technical-design/SKILL.md`.
   - Present the report and wait for user dispositions.
   - Record dispositions in `decisions.md`.
   - Apply accepted suggestions through author update mode.
   - Repeat until no blocking suggestion is open.
5. **Enforce.** Read and apply `../enforce-architecture/SKILL.md`; generate rules only from the
   settled enforcement map and prove seeded violations fail.

## Stop conditions

Stop and report when:

- the requested boundary has been reached;
- a blocking question remains unanswered;
- a design or review tries to hand implementation scope decisions to a later executor;
- an enforcement rule lacks a seeded violation;
- the active methodology profile is missing required profile files.

## Final summary

Report the produced artifacts, open blockers, accepted/deferred/rejected decisions, enforcement
status, and verification commands run.
