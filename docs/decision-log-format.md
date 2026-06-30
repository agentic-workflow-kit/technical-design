# Decision Log Format

The decision log (`decisions.md`) is an ADR-lite document created during the `author` stage and appended to during the `review` loop. It records the disposition of every suggestion made by the review agent.

## Template

```markdown
# Design Decisions — <design name>

> One entry per review disposition. Status legend: accepted · rejected · deferred.

---

## D-001 — <short title>
- **Date:** <YYYY-MM-DD>
- **Suggestion:** S-001 (<dimension> — <short finding>)
- **Decision:** <accepted | rejected | deferred>
- **Rationale:** <Why this decision was made by the human>
- **Consequence:** <What changed in the design, or what risk was accepted>
- **Status:** <applied (design round X) | open-deferred | rejected>
```

## Rules
- Every suggestion disposition MUST be logged here.
- If a suggestion is `accepted`, its consequence must describe the edit applied to the design doc, and its status becomes `applied`.
- If a suggestion is `rejected` or `deferred`, the rationale justifies why the team is intentionally bypassing the recommendation. If the rejection leaves a known gap, it should be appended to the design document's Risks section.
- History is append-only. Re-reviews add new rounds and new decisions; they do not rewrite past decisions.
