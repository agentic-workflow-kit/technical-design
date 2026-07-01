# Principles of Technical Design

## 1. Approval before commitment

Do not write durable design docs or planner-facing facts until required inputs are resolved, the
system model is approved, and the docs structure is approved. A coherent generated design is still
wrong if it skips the human agreement points that shape architecture.

## 2. Architecture mode before DDD depth

DDD is the active v1 methodology, but the first lens is `architecture_mode`: system-entity model,
lifecycle/state-machine, ports-and-adapters, control-plane/runtime, contract/seam design,
strategic-DDD, or tactical-DDD. Choose `ddd_depth` only after the system shape is visible.

## 3. DDD-first, not DDD-theater

Every design still uses strategic DDD where it helps: language, bounded contexts, ownership,
boundaries, and invariants. Tactical DDD is ceremony-right-sized. Add aggregates, value objects,
domain events, and anti-corruption layers only when behavior, invariants, external integration, or
consistency concerns need them.

## 4. Source-grounded before interview

Read the brief, PRD, existing design docs, source surfaces, and current boundary rules before asking
questions. Ask only questions that materially change ownership, context boundaries, data/query shape,
consistency, migration/deploy, observability, security, or testing.

## 5. Boundaries are named ownership, not folder taste

A boundary is meaningful only when the design says what a context owns, what it reads, what it does
not own, and which dependency directions are allowed. Folder names are implementation evidence, not
the design authority.

## 6. Diagrams explain; they do not decide

Use diagrams only to explain approved entities, flows, lifecycles, or boundaries. If a diagram needs
to add a new entity, seam, state, or dependency, record it as a design decision before treating it as
part of the architecture.

Diagrams also carry an altitude: an overview or parent diagram shows only its own document's
skeleton, and a child diagram zooms into the one piece it owns. Detail that belongs to a child does
not cascade up into the overview — a hairball of crossing, labeled edges is a defect, not rigor — and
no diagram may draw a flow the system does not actually perform.

## 7. Review proposes, user disposes

Review never silently edits a design. It emits suggestions with severity, lens, evidence, and a
proposed fix. The user accepts, rejects, or defers each suggestion, and the decision log records the
rationale.

## 8. Readiness is reconstructed

Do not accept "covered", "enforced", or "ready" as prose. Rebuild the claim from source artifacts:
requirements to design sections, invariant operands to declared fields, failure tokens to producer
catalogs, approved system model to authored sections, public APIs to export lines, and boundary rules
to seeded violations.

## 9. Intent becomes enforceable

A settled design must identify which rules are enforceable and which are manual review obligations.
For TS-first v1, enforceable boundaries become dependency-cruiser or ESLint rules with seeded
violations that prove the gate can fail.
