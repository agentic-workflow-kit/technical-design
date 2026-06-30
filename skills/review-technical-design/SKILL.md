---
name: review-technical-design
description: 'Use when a user wants to review a technical design — when they say "review this design", "check my architecture", "review-technical-design", or provide a design draft. Emits structured suggestions without auto-editing. Flags over/under engineering. Drives a convergence loop where "settled" means no `blocking` suggestions are `open`.'
---

# review-technical-design

Review a technical design (either a new draft authored by `author-technical-design` or an external RFC) to ensure it is right-sized, boundary-clear, and enforceable. 

It **never auto-edits the design**. Instead, it emits structured **suggestions** and drives a review loop where the user disposes of each suggestion (fix / reject / defer). Accepted fixes are then applied to the design, and the disposition is logged to `decisions.md`. The design is considered **settled** when no `blocking` suggestions remain `open`.

## References

- Suggestion Schema: `templates/suggestion.schema.json`
- Human Review Report Template: `templates/review-report.md`
- Review loop example: `examples/review-with-decisions.md`

## Step 0 - Show the flow

Before reviewing, show the assumed flow:

```text
I will do: analyze design -> identify over/under-engineering -> draft structured suggestions -> present human-facing report -> wait for user dispositions.
```

## Step 1 - Analyze Design

Read the provided design document.
Look for:
- **Altitude**: Is the design altitude justified? Or is it over-engineered (e.g. tactical DDD for simple CRUD) or under-engineered (e.g. no invariants when there are complex state transitions)?
- **Boundaries**: Are boundaries explicit and dependency direction enforced (e.g. domain does not import infra or db)?
- **Use-cases**: Are vertical slices clear?
- **Failure & Consistency**: Are edge cases, retries, idempotency handled?
- **Testability & Observability**: Are there clear seams for testing?

## Step 2 - Draft Structured Suggestions

For each issue found, formulate a suggestion matching the schema `templates/suggestion.schema.json`.
- Allocate an `id` (e.g. S-001, S-002).
- Assign a `severity` (`blocking`, `recommended`, `optional`).
- Identify the `dimension` (e.g. altitude, boundary, consistency).
- Propose a concrete fix, without applying it.

Always populate over-engineering and under-engineering flags explicitly (even if empty).

## Step 3 - Present Review Report

Generate a human-facing report conforming to `templates/review-report.md` and the machine-readable `suggestion.schema.json`.
It must include:
- A Verdict: `<settled>` if no blocking suggestions are open, otherwise `<open: X blocking, Y recommended>`.
- Over-engineering and Under-engineering flags explicitly called out.
- A markdown table listing the suggestions (`id`, `sev`, `dimension`, `finding`, `proposed fix`).
- A prompt asking the user for dispositions: "reply per id with **fix / reject / defer (+reason)** → recorded to `decisions.md`."

## Step 4 - Await Dispositions

Wait for the user to provide their dispositions. Do not edit the design document directly.
- The user will respond with actions for each suggestion (`fix`, `reject`, `defer`).
- Upon receiving dispositions, update the status of the suggestions.
- **Accepted** suggestions should prompt `author-technical-design` (or direct user/agent editing) to update the design and bump the design round, then record to `decisions.md`.
- **Rejected** or **Deferred** suggestions must be recorded in `decisions.md` with their rationale and tracked in the design's Risks section.
- **Convergence**: The design is settled only when no `blocking` suggestion is `open`. Previously rejected or deferred items remain in their respective statuses and are not re-raised unless the design has changed in a way that reopens them.
