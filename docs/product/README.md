# Product

What `technical-design` is, where it sits in the suite, and when to reach for it. For *how* it
works internally, see [`../design/`](../design/).

## What it is

`technical-design` is the **design stage** of the agentic-workflow-kit suite. It packages the
discipline a strong model does not reliably apply by itself: source-grounded input resolution,
human-approved system modeling, DDD-first authoring, review as a recorded decision loop, and
architectural boundaries made enforceable in CI.

It ships as a set of composable AI skills (`inputs → system model → structure → author → diagrams →
review ⇄ decide → enforce`, with an `orchestrate` runbook), not as a framework or a code generator.

## Where it sits

```text
define-product  ->  technical-design  ->  design-to-plan  ->  jig  ->  learning loop
```

- **define-product** owns what and why.
- **technical-design** owns approved architecture shape: resolved inputs, system model, design docs,
  review decisions, and enforceable architecture rules.
- **design-to-plan** consumes the approved technical-design handoff and produces the Jig-ready
  execution plan.
- **jig** owns deterministic execution from an approved plan and must not consume
  `technical-design` internals or DDD profile detail.

The stage is standalone today and is shaped to slot into the suite as the design layer.

## When to use it

- You are turning a brief, PRD, or design notes into an approved technical design before delivery
  planning.
- You need human approval of the system model and document structure before durable design docs are
  written.
- You want domain boundaries, ownership, and invariants made explicit and checkable.
- You want architectural rules that fail CI when the implemented dependency graph violates the
  agreed design.

## When *not* to use it

The pack is DDD-first in v1. DDD ceremony is not always warranted — see
[`when-not-to-use-ddd.md`](when-not-to-use-ddd.md) for the fit guidance.

## Status

Built for local use via manual skill invocation. Not yet packaged as an installable plugin.
