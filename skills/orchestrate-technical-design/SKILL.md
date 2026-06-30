---
name: orchestrate-technical-design
description: 'Use when a user wants to run the full technical design process hands-off or orchestrate parts of it. Runs frame -> author -> review (loop) -> enforce end-to-end, pausing for the user''s dispositions in the review loop, and stopping at the requested boundary. Reuses the individual skills without reimplementing their logic.'
compatibility: 'Orchestrates by sequentially reading and applying instructions from sibling skill files.'
---

# orchestrate-technical-design

Orchestrates the five skills in the `technical-design` pack to run an end-to-end design pipeline. It acts as a runbook, reading and applying the instructions of the individual skills.

## Behavior

The orchestration flows sequentially through the following stages:

1. **Intake**: Reads and applies `skills/frame-technical-design/SKILL.md` to clarify the problem, ask blocking questions, and determine complexity drivers.
2. **Draft**: Reads and applies `skills/author-technical-design/SKILL.md` using the resulting `problem-frame.md` to author a right-sized design doc (`design-doc.md`) and seeds `decisions.md`.
3. **Loop**:
    - Reads and applies `skills/review-technical-design/SKILL.md` to emit suggestions.
    - Prompts the user to dispose of the suggestions (`fix`, `reject`, `defer`) with rationales.
    - Records the dispositions into `decisions.md`.
    - If `fix` dispositions exist, reads and applies `skills/author-technical-design/SKILL.md` in update mode.
    - Loops until settled (0 `blocking` suggestions in the `open` state).
4. **Enforce**: Once the design is settled, reads and applies `skills/enforce-architecture/SKILL.md` to translate the agreed boundaries into CI gate files.

## Instructions

1. Identify the input and the requested stopping boundary (e.g., "stop after review").
2. Execute each step sequentially by reading and applying the corresponding `SKILL.md`. Do NOT perform the tasks manually—rely strictly on the instructions within those files.
3. When reaching the review loop, pause and present the `review-report.md` to the user. Wait for their dispositions before proceeding to enforce.
4. Output a final run summary containing the links to the generated artifacts (`problem-frame.md`, `design-doc.md`, `decisions.md`, and CI configuration).
