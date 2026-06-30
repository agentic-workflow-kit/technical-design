# Product

What `technical-design` is, where it sits in the suite, and when to reach for it. For *how* it
works internally, see [`../design/`](../design/).

## What it is

`technical-design` is the **design stage** of the agentic-workflow-kit suite. It packages the
discipline a strong model does not reliably apply by itself: source-grounded framing, DDD-first
modeling, review as a recorded decision loop, and architectural boundaries made enforceable in CI.

It ships as a set of composable AI skills (`frame → author → review ⇄ decide → enforce`, with an
`orchestrate` runbook), not as a framework or a code generator.

## Where it sits

```text
define / PRD  ->  technical-design  ->  jig (run)  ->  learning loop
```

- **Define / PRD** owns what and why.
- **technical-design** owns high-level how: domain boundaries, review decisions, and enforceable
  architecture rules.
- **jig** owns deterministic execution from an approved plan.

The stage is standalone today and is shaped to slot into the suite as the design layer.

## When to use it

- You are turning a brief, PRD, or design notes into a technical design before delivery planning.
- You want domain boundaries, ownership, and invariants made explicit and checkable.
- You want architectural rules that fail CI when the implemented dependency graph violates the
  agreed design.

## When *not* to use it

The pack is DDD-first in v1. DDD ceremony is not always warranted — see
[`when-not-to-use-ddd.md`](when-not-to-use-ddd.md) for the fit guidance.

## Status

Built for local use via manual skill invocation. Not yet packaged as an installable plugin.
