# Problem Frame

> Intake artifact for DDD-first technical design. It records source evidence, assumptions, blockers,
> context candidates, and initial depth before authoring.

## 1. Scope and Goal

- **Source request:** <brief, PRD, task, or design draft>
- **Goal:** <what we are building and why>
- **Out of scope:** <what this design must not cover>

## 2. Source Map

| Source | Authority | Establishes | Gaps / stale risk |
|---|---|---|---|
| <path or source id> | <authoritative/supporting/background> | <fact> | <gap or none> |

## 3. Assumptions and Blockers

### Safe Assumptions
- <assumption and why it is safe>

### Blocking Questions
- <question and why the answer changes the design>

## 4. DDD Context Candidates

| Candidate context | Owns | Reads | Does Not Own | Open ownership question |
|---|---|---|---|---|
| <context> | <owned facts/decisions/behavior> | <consumed facts> | <nearby concern> | <question or none> |

## 5. Complexity Drivers

- **Invariants:** <rules that must never be broken>
- **State transitions:** <lifecycles, status changes, temporal rules>
- **Integrations:** <external systems and anti-corruption needs>
- **Consistency:** <strong/eventual, idempotency, replay, audit>
- **Security and authorization:** <tenant/user/role/fail-closed needs>
- **Migration/deploy:** <schema/config/backfill/rollout constraints>
- **Observability:** <events, metrics, audit records, logs>
- **Testing:** <unit, integration, contract, architecture, property tests>

## 6. Initial DDD Depth

**Selected depth:** <strategic-only | use-case-slices | ports-and-adapters | tactical-ddd>

**Why this depth fits:** <rationale from drivers>

**Where tactical depth is intentionally omitted:** <contexts or concerns that stay simpler>

## 7. Handoff to Author

- **Design artifact target:** <path or suggested path>
- **Required methodology profile:** `ddd`
- **Delivery constraints to preserve:** <sequencing, files, gates, stop conditions>
