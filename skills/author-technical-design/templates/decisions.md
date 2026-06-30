# Design Decisions — <design name>

> One entry per review disposition. Status legend: accepted · rejected · deferred.

---

## D-001 — <short title>
- **Date:** <YYYY-MM-DD>
- **Suggestion:** S-001 (boundary — domain imports the DB model)
- **Decision:** accepted
- **Rationale:** boundary leak; cheap to fix now, expensive later.
- **Consequence:** added repository port in §Boundaries; enforced by fitness-rule `no-domain-to-infra`.
- **Status:** applied (design round 2)

## D-002 — <short title>
- **Date:** <YYYY-MM-DD>
- **Suggestion:** S-002 (consistency — no idempotency on retried write)
- **Decision:** deferred
- **Rationale:** single-writer path today; revisit when we add the retry queue.
- **Consequence:** tracked as a known risk in the design's Risks section.
- **Status:** open-deferred
