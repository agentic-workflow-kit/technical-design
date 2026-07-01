# Design

How `technical-design` works: the methodology mechanics, the contracts the skills depend on, and
the recurring lessons that shape the gates. For *what & why*, see [`../product/`](../product/).

## Lifecycle

- [`flows.md`](flows.md) — the staged design lifecycle and the entry flows (full, in-session,
  existing-design review, orchestrated).

## Principles and ladders

- [`principles.md`](principles.md) — the operating principles the skills enforce.
- [`altitude-ladder.md`](altitude-ladder.md) — DDD depth ladder (strategic-only → tactical).
- [`reference.md`](reference.md) — DDD-first reference heuristics (guarding vs validating, closure,
  exposure-as-evidence, enforcement-needs-a-seed).
- [`evaluation-strategy.md`](evaluation-strategy.md) — layered grading strategy for design-quality
  evals, LLM judges, calibration, and downstream outcome checks.
- [`when-not-to-use-ddd.md`](../product/when-not-to-use-ddd.md) — fit guidance (lives under product).

## Contracts and formats

- [`technical-design-handoff-contract.md`](technical-design-handoff-contract.md) — the
  planner-facing document format contract: required pre-authoring approvals, identity fields, stable
  IDs, handoff facts, methodology-neutral preservation rules, and vacuous-handoff review guidance.
- [`methodology-profile-contract.md`](methodology-profile-contract.md) — the stable interface a
  methodology profile under `methodologies/` must satisfy.
- [`decisions.md`](decisions.md) — the repository's own append-only design decisions log.
- [`decision-log-format.md`](decision-log-format.md) — the `decisions.md` disposition format.
- [`suggestion-format.md`](suggestion-format.md) — the review suggestion shape.

## Lessons

- [`lessons-ledger.md`](lessons-ledger.md) — recurring defect classes distilled from prior design
  and delivery work, each mapped to a gate, rubric item, enforcement rule, or eval.
