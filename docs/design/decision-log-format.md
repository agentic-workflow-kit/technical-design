# Decision Log Format

The decision log (`decisions.md`) is an append-only ADR-lite artifact created by `author` and extended
during the review loop.

## Entry shape

```markdown
## D-001 - <short title>

- **Date:** <YYYY-MM-DD>
- **Suggestion:** S-001 (<lens> / <dimension> - <short finding>)
- **Decision:** <accepted | rejected | deferred>
- **Rationale:** <why the user chose this outcome>
- **Consequence:** <what changed, what risk remains, or what is deferred>
- **Design round:** <round number or not applied>
- **Status:** <applied | open-deferred | rejected>
```

## Rules

- Every suggestion disposition must be logged.
- Accepted decisions must identify the design section, enforcement map, or delivery input changed.
- Rejected and deferred decisions must give a rationale and remain visible in risks if they leave a
  known gap.
- History is append-only. Re-review adds entries; it does not rewrite past decisions.
