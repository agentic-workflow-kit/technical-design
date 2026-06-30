---
methodology: ddd
methodology_version: "1"
design_status: draft
ddd_depth: <strategic-only | use-case-slices | ports-and-adapters | tactical-ddd>
round: 1
---

# Technical Design - <design name>

## 1. Source and Context Audit

| Source | Used for | Notes |
|---|---|---|
| <PRD / brief / source file> | <requirements, existing behavior, constraints> | <notes> |

## 2. Assumptions and Blockers

### Safe Assumptions
- <assumption and why it is safe>

### Blocking Questions
- <question that would change ownership, boundaries, data, consistency, deploy, security, or tests>

## 3. DDD Depth

**Selected depth:** <strategic-only | use-case-slices | ports-and-adapters | tactical-ddd>

**Why this depth is sufficient:** <rationale>

**Why deeper tactical ceremony is unnecessary where omitted:** <rationale>

## 4. Context Map

| Context | Owns | Reads | Does Not Own |
|---|---|---|---|
| <context> | <facts, decisions, data, behavior> | <external facts it consumes> | <nearby concerns owned elsewhere> |

## 5. Ubiquitous Language

| Term | Meaning | Owner |
|---|---|---|
| <term> | <precise meaning> | <context> |

## 6. Domain Behavior

| Command / Use Case | Actor | Invariant guarded | Result |
|---|---|---|---|
| <command> | <actor/system> | <invariant> | <state/event/output> |

## 7. Invariant and State Matrix

| Invariant / Predicate | Source operands | Enforced by | Failure token |
|---|---|---|---|
| <rule> | <declared fields/events/projections> | <context/aggregate/service> | <token> |

## 8. Ports, Adapters, and Public API

| Surface | Type | Owner | Consumers | Enforcement |
|---|---|---|---|---|
| <port/API/export> | <domain port/public export/adapter> | <context> | <consumers> | <import test/rule/manual> |

## 9. Data, Query, and Consistency

- **Write model:** <transaction boundary, idempotency, concurrency>
- **Read model:** <queries, projections, freshness>
- **Consistency:** <strong/eventual/manual reconciliation>

## 10. Failure, Observability, Migration, and Deploy

- **Failure modes:** <dependency failures, degraded states, fail-closed behavior>
- **Observability:** <events, metrics, logs, audit records>
- **Migration/deploy:** <schema/data/config/rollout/rollback impacts>

## 11. Testing and Enforcement

| Claim | Proof | Standing gate |
|---|---|---|
| <boundary/invariant/public API> | <test/fixture/static rule> | <command or CI lane> |

## 12. Delivery Inputs

- **Candidate story areas:** <list>
- **Sequencing constraints:** <producer before consumer constraints>
- **File contention:** <shared files or none>
- **Validation expectations:** <commands/gates>
- **Stop conditions:** <when implementation should stop and return to design>

## 13. Risks and Deferred Decisions

- <risk, deferred suggestion, or accepted tradeoff with decision id>
