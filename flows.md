# Flows

The `technical-design` skill pack orchestrates a design lifecycle consisting of five distinct skills. The review phase operates as a convergence loop.

```mermaid
flowchart LR
    FRAME[frame\n(clarify + scope)] --> AUTHOR[author\n(right-sized draft)]
    AUTHOR --> REVIEW[review\n(suggest fixes)]
    REVIEW <-->|loop until settled| DECIDE[user disposes\n+ records decisions]
    DECIDE --> ENFORCE[enforce\n(CI gate)]
```

## Flow A — Full Design
When starting from a brief or PRD.
1. `frame` clarifies the problem and determines complexity drivers.
2. `author` produces a right-sized draft, setting boundaries and altitude.
3. `review` issues suggestions. User dispositions are recorded in `decisions.md`. The loop repeats until no `blocking` suggestions remain open.
4. `enforce` generates CI rules to make the boundaries durable.

## Flow B — In-Session Task
When executing a smaller in-session task (e.g., "add X to this service").
1. Lightweight `frame` asks only critical questions.
2. Lightweight `author` proposes a focused change.
3. Lightweight review loop.
4. `enforce` updates rules only if boundaries changed.

## Flow C — Review Existing Design
When an RFC or external draft already exists.
1. `review` analyzes the design and emits suggestions.
2. User disposes of suggestions (fix/reject/defer), recording them.
3. Author of the design applies accepted changes.
4. Re-review until settled.

## Flow D — Orchestrated (Hands-Off)
The `orchestrate-technical-design` skill runs the entire pipeline end-to-end. It drives Flow A automatically, pausing only for the human user to provide dispositions during the review loop, and stops exactly where instructed.
