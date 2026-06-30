# Example: Review with Decisions

This demonstrates a full loop: `review-technical-design` emits suggestions, the user provides dispositions, and the decisions are recorded to `decisions.md`.

## 1. Initial Review (Round 1)

`review-technical-design` analyzes `design-doc.md` and outputs the following report:

```markdown
## Review — Payment Processing System  (round 1)

**Verdict:** open: 1 blocking, 1 recommended
**Over-engineering flags:** none
**Under-engineering flags:** missing idempotency on a financial transaction

| id    | sev        | dimension    | finding                               | proposed fix                  |
|-------|------------|--------------|---------------------------------------|-------------------------------|
| S-001 | blocking   | boundary     | domain imports the DB model directly  | introduce a repository port   |
| S-002 | recommended| consistency  | no idempotency on retried write       | add idempotency key on charge cmd|

_Disposition_: reply per id with **fix / reject / defer (+reason)** → recorded to `decisions.md`.
```

The underlying machine list also outputs the above data in `suggestion.schema.json` format, with `status: "open"`.

## 2. User Dispositions

The user replies to the AI:
> - S-001: fix. We should use ports and adapters here.
> - S-002: defer. We only have a single-writer path today, we will revisit when we add the retry queue.

## 3. Decisions Log Updated

The system (via `author-technical-design` in update mode or directly as a tracked decision step) creates/updates `decisions.md`:

```markdown
# Design Decisions — Payment Processing System

> One entry per review disposition. Status legend: accepted · rejected · deferred.

---

## D-001 — Introduce Repository Port
- **Date:** 2026-06-30
- **Suggestion:** S-001 (boundary — domain imports the DB model)
- **Decision:** accepted
- **Rationale:** boundary leak; cheap to fix now, expensive later.
- **Consequence:** added repository port in §Boundaries; enforced by fitness-rule `no-domain-to-infra`.
- **Status:** applied (design round 2)

## D-002 — Add Idempotency to Charge
- **Date:** 2026-06-30
- **Suggestion:** S-002 (consistency — no idempotency on retried write)
- **Decision:** deferred
- **Rationale:** single-writer path today; revisit when we add the retry queue.
- **Consequence:** tracked as a known risk in the design's Risks section.
- **Status:** open-deferred
```

## 4. Re-review (Round 2)

After applying the accepted changes to `design-doc.md` (which is typically done by `author-technical-design` in update mode), the user runs `review-technical-design` again.
S-001 was fixed, and S-002 is deferred (tracked). No new issues are found.

```markdown
## Review — Payment Processing System  (round 2)

**Verdict:** settled
**Over-engineering flags:** none
**Under-engineering flags:** none

| id    | sev        | dimension | finding                          | proposed fix                  |
|-------|------------|-----------|----------------------------------|-------------------------------|
| (No open suggestions) | | | | |

_Disposition_: reply per id with **fix / reject / defer (+reason)** → recorded to `decisions.md`.
```
