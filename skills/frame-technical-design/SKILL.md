---
name: frame-technical-design
description: 'Use when a user asks to design a technical solution, architecture, or system, and you need to clarify the problem first. Explores the problem, surfaces blocking unknowns, asks clarifying questions, and identifies complexity drivers (invariants, state transitions) that inform altitude. Produces a problem frame.'
---

# frame-technical-design

Explore a feature brief, PRD, or single-line task before authoring a technical design. This is the **intake** phase (divergent). 
It identifies complexity drivers, surfaces blocking unknowns, and records safe assumptions. The goal is to provide enough clarity to choose the right architecture altitude in the next step, without over- or under-engineering it.

## Step 0 - Show the flow

Before drafting, show the assumed flow:

```text
I will do: read inputs -> identify complexity drivers -> draft assumptions -> ask blocking questions -> write problem-frame.md -> suggest author-technical-design.
```

## Step 1 - Ingest inputs

Read the raw brief, PRD, one-line task, or existing brainstorming material provided by the user. Do not reinvent existing context.

## Step 2 - Analyze complexity

Identify **complexity drivers** that will influence the architecture's "altitude" (CRUD vs. Layered vs. DDD). Look for:
- Invariants that must be strictly enforced
- Complex state transitions
- External integrations and boundaries
- Consistency needs (e.g., strong vs. eventual, retries)
- Scale and performance constraints

## Step 3 - Ask and assume (Lightweight mode aware)

- Formulate clarifying questions for any **blocking unknowns**.
- For things that can be safely guessed, record **safe assumptions** instead of silently assuming or over-asking.
- **Lightweight mode**: If this is a small in-session task ("add X to this service"), ask *only* genuinely blocking questions. Keep it fast.

## Step 4 - Output artifact

Write `problem-frame.md` using the template at `templates/problem-frame.md`.
Record the questions (answered or safely assumed), the complexity drivers, and the agreed scope.

## Step 5 - Handoff

When the problem frame is complete, recommend the next step: `author-technical-design`.
