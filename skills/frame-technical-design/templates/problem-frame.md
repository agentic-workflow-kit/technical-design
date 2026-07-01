# Problem Frame

> Intake artifact for DDD-first technical design. It records source evidence, InputResolution,
> AgreedSystemModel, architecture mode, and initial depth before authoring.

## 1. Scope and Goal

- **Source request:** <brief, PRD, task, or design draft>
- **Goal:** <what we are building and why>
- **Out of scope:** <what this design must not cover>

## 2. Source Map

| Source | Authority | Establishes | Gaps / stale risk |
|---|---|---|---|
| <path or source id> | <authoritative/supporting/background> | <fact> | <gap or none> |

## 3. InputResolution

| Required input | Source evidence | Resolution | Owner / impact | Approval status |
|---|---|---|---|---|
| <ownership, invariant, lifecycle, API, data, failure, observability, enforcement, or delivery input> | <source ref or missing> | <provided / safe assumption / requires approval / blocked> | <context, fact ID, or decision impact> | <approved / pending / blocked / not required> |

## 4. AgreedSystemModel

| Entity | Responsibilities | Owns | Reads | Does Not Own |
|---|---|---|---|---|
| <entity> | <responsibilities> | <facts/decisions/behavior> | <consumed facts> | <nearby concerns owned elsewhere> |

### Relations

| From | Relation | To | Notes |
|---|---|---|---|
| <entity> | <reads/calls/emits/configures/runs> | <entity> | <direction and constraints> |

### Seams and External Boundaries

- <seam, external boundary, or contract surface>

### Lifecycle and State Terms

- <state, transition, or lifecycle authority>

### Mode and Depth

- **architecture_mode:** <system-entity-model / lifecycle/state-machine / ports-and-adapters / control-plane/runtime / contract/seam design / strategic-ddd / tactical-ddd>
- **initial ddd_depth:** <strategic-only / use-case-slices / ports-and-adapters / tactical-ddd>

### Open Questions and Approval

- <question and approval status>

## 5. Assumptions and Blockers

### Safe Assumptions
- <assumption and why it is safe>

### Blocking Questions
- <question and why the answer changes the design>

## 6. DDD Context Candidates

| Candidate context | Owns | Reads | Does Not Own | Open ownership question |
|---|---|---|---|---|
| <context> | <owned facts/decisions/behavior> | <consumed facts> | <nearby concern> | <question or none> |

## 7. Complexity Drivers

- **Invariants:** <rules that must never be broken>
- **State transitions:** <lifecycles, status changes, temporal rules>
- **Integrations:** <external systems and anti-corruption needs>
- **Consistency:** <strong/eventual, idempotency, replay, audit>
- **Security and authorization:** <tenant/user/role/fail-closed needs>
- **Migration/deploy:** <schema/config/backfill/rollout constraints>
- **Observability:** <events, metrics, audit records, logs>
- **Testing:** <unit, integration, contract, architecture, property tests>

## 8. Architecture Mode and Initial DDD Depth

**Selected architecture_mode:** <system-entity-model / lifecycle/state-machine / ports-and-adapters / control-plane/runtime / contract/seam design / strategic-ddd / tactical-ddd>

**Selected depth:** <strategic-only / use-case-slices / ports-and-adapters / tactical-ddd>

**Why this depth fits:** <rationale from drivers>

**Where tactical depth is intentionally omitted:** <contexts or concerns that stay simpler>

## 9. Handoff to Author

- **Design artifact target:** <path or suggested path>
- **Required methodology profile:** `ddd`
- **Approval status:** <approved | pending approval | blocked>
- **Delivery constraints to preserve:** <sequencing, files, gates, stop conditions>
