# Principles of Technical Design

## 1. DDD-first, not DDD-theater

Every design starts with strategic DDD: language, bounded contexts, ownership, boundaries, and
invariants. Tactical DDD is ceremony-right-sized. Add aggregates, value objects, domain events, and
anti-corruption layers only when behavior, invariants, external integration, or consistency concerns
need them.

## 2. Source-grounded before interview

Read the brief, PRD, existing design docs, source surfaces, and current boundary rules before asking
questions. Ask only questions that materially change ownership, context boundaries, data/query shape,
consistency, migration/deploy, observability, security, or testing.

## 3. Boundaries are named ownership, not folder taste

A boundary is meaningful only when the design says what a context owns, what it reads, what it does
not own, and which dependency directions are allowed. Folder names are implementation evidence, not
the design authority.

## 4. Review proposes, user disposes

Review never silently edits a design. It emits suggestions with severity, lens, evidence, and a
proposed fix. The user accepts, rejects, or defers each suggestion, and the decision log records the
rationale.

## 5. Readiness is reconstructed

Do not accept "covered", "enforced", or "ready" as prose. Rebuild the claim from source artifacts:
requirements to design sections, invariant operands to declared fields, failure tokens to producer
catalogs, public APIs to export lines, and boundary rules to seeded violations.

## 6. Intent becomes enforceable

A settled design must identify which rules are enforceable and which are manual review obligations.
For TS-first v1, enforceable boundaries become dependency-cruiser or ESLint rules with seeded
violations that prove the gate can fail.
