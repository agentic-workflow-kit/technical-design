---
title: technical-design PRD
status: v0
---

# technical-design PRD

This is the product definition for **technical-design the tool** — the authoritative source of its requirements, acceptance criteria, constraints, assumptions, and non-goals. The [product overview](./README.md) narrates the _what and why_ for readers; this PRD is what the design step reconciles to.

**Product identity.** technical-design is a self-contained pack of AI skills and supporting evaluation tools for technical design. It is meant to be useful two ways: **on its own as an independent plugin**, for anyone who needs to author and review software designs, and as the **Design layer** of the agentic-workflow-kit suite — in both cases producing design documents that conform to the [technical-design-handoff-contract](../design/technical-design-handoff-contract.md).

## Product Outcome

A developer or agent can turn a verified product definition (PRD) into an approved technical design using a structured decision-recording loop, producing a planning-ready handoff summary with stable fact IDs that prevents premature design commitment and downstream scope-inventing.

## User Job

A technical designer or agent needs to resolve inputs, agree on a high-level system model, structure design documents, author a DDD-first design, review it against quality lenses, record decisions append-only, and enforce architectural boundaries in CI.

## Acceptance Criteria

| ID | Criterion | Status |
| --- | --- | --- |
| AC-FRAME-001 | frame-technical-design inspects source docs and current technical surfaces before asking questions. | Active |
| AC-FRAME-002 | frame-technical-design produces an InputResolution classifying required inputs as provided, safe assumption, requires approval, or blocked. | Active |
| AC-FRAME-003 | frame-technical-design produces an AgreedSystemModel specifying entities, responsibilities, relations, ownership boundaries, lifecycle/state terms, architecture mode, and ddd depth. | Active |
| AC-AUTHOR-001 | author-technical-design produces a DocStructurePlan detailing the docs tree and file responsibilities before writing design docs. | Active |
| AC-AUTHOR-002 | author-technical-design writes DDD-first docs matching the approved model and structure, carrying proper DDD frontmatter. | Active |
| AC-AUTHOR-003 | author-technical-design generates design diagrams tracing strictly to approved entities, flows, or boundaries without inventing scope. | Active |
| AC-REVIEW-001 | review-technical-design emits structured suggestions graded against architecture, domain-correctness, and agreement-integrity lenses. | Active |
| AC-REVIEW-002 | review-technical-design records decision dispositions in an append-only decisions.md decision log without editing the design directly. | Active |
| AC-ENFORCE-001 | enforce-architecture translates the design's enforcement map into executable, TS-first dependency rules in CI. | Active |
| AC-ENFORCE-002 | enforce-architecture requires a seeded violation in test fixtures to verify that the enforcement gate fails when a rule is violated. | Active |
| AC-ORCH-001 | orchestrate-technical-design composes the design skills in sequence, pausing for approvals and dispositions, and stopping at requested boundaries. | Active |

## Constraints

- The pack must be methodology-neutral at its shell, with DDD-first as the v1 profile.
- Must export a valid Planner Handoff Summary conforming to `technical-design-handoff-v0`.
- Tooling packages and eval harnesses must run under the `pnpm check` gate.

## Assumptions

- Product PRD inputs carry stable acceptance-criteria IDs.
- Downstream planning layers will read from the published handoff summary table, not prose details.

## Non-Goals

- Not a runtime database or application server.
- Not a code generator or folder scaffold framework.
- Not dependent on application-specific private case studies.

## Downstream Citation Map

- Planning (`design-to-plan`) may cite the Planner Handoff Summary fact IDs.
- Downstream tools must not consume internal DDD profile details or prose.
