# Example: Full Orchestration Flow

**User:**
"Design a new checkout payment service. Orchestrate the whole flow and stop after the review loop."

**Agent (`orchestrate-technical-design`):**
Running the technical design runbook. Active methodology profile: `ddd`.

## Step 1: Frame

Reading and applying `frame-technical-design`.

*Result:* Created `problem-frame.md` with source map, context candidate, idempotency invariant,
gateway integration, and initial `ddd_depth: ports-and-adapters`.

## Step 2: Author

Reading and applying `author-technical-design`.

*Result:* Created `technical-design.md` with DDD frontmatter, context map, ubiquitous language,
invariant matrix, ports/adapters, enforcement map, delivery inputs, and seeded `decisions.md`.

## Step 3: Review Loop

Reading and applying `review-technical-design`.

*Result:* 1 blocking suggestion and 1 recommended suggestion:

- S-001: blocking, architecture-enforceability, enforcement map rule has no seeded violation.
- S-002: recommended, domain-correctness, authorization amount invariant is missing one operand.

**Please provide dispositions for S-001 and S-002 with reasons.**

**User:**
"S-001 fix; the gate needs a failing seed. S-002 fix; source both operands."

**Agent:**

- Logged D-001 and D-002 to `decisions.md`.
- Read and applied `author-technical-design` update mode for accepted decisions.
- Re-read and applied `review-technical-design`.
- Result: 0 open blocking suggestions. Design is settled.

**Stopping orchestration at review boundary as requested.**

Final artifacts: `problem-frame.md`, `technical-design.md`, `decisions.md`.
