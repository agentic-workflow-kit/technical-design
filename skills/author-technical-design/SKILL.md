---
name: author-technical-design
description: 'Use when the user wants to write a technical design document from a problem frame and brief/PRD. Sets architecture altitude (from simple CRUD to tactical DDD), defines explicit boundaries, failure/consistency model, risks, and boundary rules for enforcement. Also used in update mode to apply an accepted decision to the design.'
---

# author-technical-design

Author a technical design document based on a problem frame and brief/PRD. The design focuses on right-sizing the architecture altitude, explicit boundaries, use-case slices, failure/consistency models, and risks. It initializes an ADR-lite decisions log.

## References (read before acting)
- Problem frame (`problem-frame.md`)
- PRD or feature brief
- Altitude ladder: `technical-design/docs/altitude-ladder.md`
- Decision format: `technical-design/skills/author-technical-design/templates/decisions.md`

## Step 1: Ingest Context
Read the output of `frame-technical-design` (`problem-frame.md`) and the relevant PRD or feature brief. Identify the stated complexity drivers. 

## Step 2: Determine Architecture Altitude
Evaluate the complexity drivers to choose the right architecture altitude. 
Altitude ladder:
1. **CRUD / Layered**: Simple data access, no complex domain logic. Bias towards this!
2. **Use-case slices**: Vertical slices when controllers/services become bloated but logic isn't heavily state-dependent.
3. **Ports & Adapters**: When you need to isolate business logic from infrastructure (e.g. database, third-party APIs).
4. **Tactical DDD**: Entities, value objects, aggregates, domain events. **Only** when complexity drivers strongly justify it (e.g. strict invariants, heavy state transitions, complex cross-aggregate consistency).

Determine over/under engineering flags. Explicitly state the chosen altitude in the design document and provide:
- **Why simpler is insufficient.**
- **Why more complex is unnecessary.**

## Step 3: Draft the Design Document
Use `templates/design-doc.md` and `templates/use-case-slice.md` to author the technical design.
The design MUST contain:
1. **Altitude**: Explicitly stated with justification.
2. **Boundaries**: Allowed and forbidden imports. What layers are permitted to know about what other layers?
3. **Use-case slices**: Detailed vertical slices. Do not split this into a separate sub-skill. 
4. **Failure & Consistency model**: How the system behaves when dependencies fail. Retry logic, idempotency, eventual consistency vs strong consistency.
5. **Risks**: Open questions or accepted tech debt.
6. **Boundary rules**: Rules that `enforce-architecture` can use to build CI gates (e.g., no domain to infra imports).

## Step 4: Seed Decisions Log
Initialize an ADR-lite log using `templates/decisions.md` if it doesn't already exist. It sits next to the design document.

## Step 5: Self-Evaluation Gate
Before finalizing, verify:
- Is the altitude explicitly stated with its justification?
- Are the boundaries and boundary rules clear enough for enforcement?
- Are the use-case slices present?
If not, revise the document.

## Update Mode (Loop)
If invoked with a known design and an `accepted` suggestion from `review-technical-design` (recorded in `decisions.md`), apply the accepted decision to the design document. Bump the round number if applicable. Do not rewrite history or close `rejected`/`deferred` items.
