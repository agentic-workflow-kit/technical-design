# DDD Eval Expectations

The DDD profile is not trusted until eval fixtures prove the skills catch common defect classes.

## Required eval classes

- Missing bounded context ownership.
- Invented failure token or state literal.
- Unsourced invariant operand.
- Public API promised but not exposed.
- Vacuous enforcement rule without a seeded violation.
- Prose-only or empty planner handoff.
- Source-invisible planner handoff fact.
- Missing producer/source closure.
- Proof-substrate mismatch.

## Grading expectations

- `frame` should find the source map and ask only blocking questions.
- `author` should produce DDD frontmatter, planner-facing handoff frontmatter, a
  `Planner Handoff Summary`, and technical-solution-compatible sections.
- `review` should emit suggestions with `lens`, `evidence`, `gate_ref`, `lesson_ref`, and `decision_ref`.
- `enforce` should fail on seeded violations and pass honestly when no enforceable boundary exists.

## Naming policy

Fixtures must be generic. They can describe domains such as payments, scheduling, or inventory, but
must not name private application repositories used as learning sources.
