# Design Decisions - technical-design

> One entry per disposition, append-only. Status legend: applied, open-deferred, rejected.
> Frame-gate entries (D-001..D-003) record the pre-authoring approvals; review dispositions append below.

---

## D-001 - Concrete form: skills pack + supporting package + eval package

- **Date:** 2026-07-01
- **Suggestion:** Frame gate (concrete form)
- **Decision:** accepted
- **Rationale:** A skills pack plus supporting packages (eval-kit and evals) matches the requirements for a self-contained, reviewable technical design pack.
- **Consequence:** Implemented under `skills/`, `methodologies/`, and `packages/`.
- **Design round:** 1
- **Status:** applied

## D-002 - Methodology profile: DDD-first in v1

- **Date:** 2026-07-01
- **Suggestion:** Frame gate (methodology)
- **Decision:** accepted
- **Rationale:** Tactical and strategic DDD provides the structure needed for clean boundaries, ubiquitous language, and system model verification.
- **Consequence:** Stored under `methodologies/ddd/`.
- **Design round:** 1
- **Status:** applied

## D-003 - Docs shape: split with altitude indices

- **Date:** 2026-07-01
- **Suggestion:** Frame gate (docs shape)
- **Decision:** accepted
- **Rationale:** The pack is documentation-heavy and defines its own contracts, necessitating a clear split between product (what/why) and design (how).
- **Consequence:** Organized under `docs/product/` and `docs/design/` with a root altitude index in `docs/README.md`.
- **Design round:** 1
- **Status:** applied
