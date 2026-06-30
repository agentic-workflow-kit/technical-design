# Example: Review with Decisions

This demonstrates a full loop: `review-technical-design` emits suggestions, the user provides
dispositions, and decisions are recorded to `decisions.md`.

## 1. Initial Review

```markdown
## Review - Payment Authorization (round 1)

**Verdict:** open: 1 blocking, 1 recommended

**Architecture/enforceability lens:** one boundary rule has no seeded violation.

**Domain-correctness lens:** one invariant is undersourced.

**Over-engineering flags:** none

**Under-engineering flags:** invariant source closure missing

| id | sev | lens | dimension | evidence | finding | proposed fix | gate | lesson |
|---|---|---|---|---|---|---|---|---|
| S-001 | blocking | architecture-enforceability | enforceability | Enforcement Map | no-domain-to-infrastructure has no seededViolation | add a seed fixture and rerun architecture gate | DDD enforcement rules | LSN-005 |
| S-002 | recommended | domain-correctness | invariant | Invariant Matrix | "approved amount matches order" names only amount, not order total source | name command.amount and OrderSnapshot.total as operands | DDD review rubric | LSN-007 |

_Disposition_: reply per id with **fix / reject / defer (+reason)**. Dispositions are recorded in
`decisions.md`; accepted fixes are applied through `author-technical-design` update mode.
```

## 2. User Dispositions

```text
S-001: fix. The architecture gate must prove the rule fails.
S-002: fix. The invariant needs both operands sourced.
```

## 3. Decisions Log

```markdown
# Design Decisions - Payment Authorization

> One entry per review disposition. Status legend: accepted, rejected, deferred.

---

## D-001 - Add architecture seed

- **Date:** 2026-06-30
- **Suggestion:** S-001 (architecture-enforceability / enforceability - no seeded violation)
- **Decision:** accepted
- **Rationale:** a boundary rule without a failing seed can pass vacuously.
- **Consequence:** added `seededViolation` to the enforcement map and architecture fixture.
- **Design round:** 2
- **Status:** applied

## D-002 - Source invariant operands

- **Date:** 2026-06-30
- **Suggestion:** S-002 (domain-correctness / invariant - unsourced operand)
- **Decision:** accepted
- **Rationale:** the predicate cannot be evaluated without both operands.
- **Consequence:** invariant matrix now cites `AuthorizePayment.amount` and `OrderSnapshot.total`.
- **Design round:** 2
- **Status:** applied
```

## 4. Re-review

```markdown
## Review - Payment Authorization (round 2)

**Verdict:** settled

**Architecture/enforceability lens:** no open findings.

**Domain-correctness lens:** no open findings.

**Over-engineering flags:** none

**Under-engineering flags:** none

| id | sev | lens | dimension | evidence | finding | proposed fix | gate | lesson |
|---|---|---|---|---|---|---|---|---|
| (No open suggestions) | | | | | | | | |
```
