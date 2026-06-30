# Example: Full Orchestration Flow

**User:**
"Design a new checkout service. Orchestrate the whole flow and stop after the review loop."

**Agent (`orchestrate-technical-design`):**
Running the technical design orchestration pipeline.

## Step 1: Frame
Invoking `frame-technical-design`...
*Result:* Created `problem-frame.md` identifying complexity drivers (external payment gateway, idempotency, PCI compliance).

## Step 2: Author
Invoking `author-technical-design`...
*Result:* Created `design-doc.md` (Altitude: Ports and Adapters selected due to external gateway). Seeded `decisions.md`.

## Step 3: Review Loop
Invoking `review-technical-design`...
*Result:* 1 blocking suggestion (S-001: Missing idempotency key for payment retries), 1 recommended suggestion (S-002: Observability span for third-party call).

**Please provide your dispositions for S-001 and S-002 (e.g., "accept S-001, defer S-002 because we will add tracing next sprint").**

**User:**
"accept S-001. defer S-002, we'll do observability later."

**Agent:**
*Result:* Logged D-001 (accepted) and D-002 (deferred) to `decisions.md`.
Invoking `author-technical-design` (Update Mode) to apply S-001.
Re-running `review-technical-design`...
*Result:* 0 open blocking suggestions. Design is SETTLED.

**Stopping orchestration at review boundary as requested.**
Final artifacts: `problem-frame.md`, `design-doc.md`, `decisions.md`.
