# Problem Frame

> Intake artifact for technical design. Captures the scope, complexity drivers, and resolved unknowns before choosing an architecture altitude.

## 1. Scope & Context

- **Source:** <link to PRD, brief, or task>
- **Goal:** <1-2 sentences on what we are building and why>
- **Out of Scope:** <Explicit boundaries of what we are NOT building>

## 2. Complexity Drivers

> These drivers inform the architecture altitude. If these are heavy, we may need tactical DDD or ports/adapters. If they are light, CRUD/layered is best.

- **Invariants:** <Rules that must never be broken, e.g., "An account balance cannot go below zero">
- **State Transitions:** <Complex lifecycles, e.g., "Order goes from Pending to Paid to Shipped">
- **Integrations:** <External systems we depend on or push to>
- **Consistency Needs:** <e.g., "Must be strongly consistent on write" or "Can be eventually consistent via events">
- **Scale / Non-functional:** <e.g., High read throughput, strict latency limits>

## 3. Clarifying Questions & Unknowns

| Question | Status | Answer / Safe Assumption |
|----------|--------|--------------------------|
| <Question 1> | [Answered] | <User's answer> |
| <Question 2> | [Assumed] | <Our safe assumption> |
| <Question 3> | [Open] | <Needs user input> |

## 4. Altitude Recommendation

> Based on the complexity drivers above, what is the initial leaning for architecture altitude?
> (e.g., Simple CRUD, Layered MVC, Use-Case Slices, Ports/Adapters, Tactical DDD)

**Initial Leaning:** <Altitude>
**Rationale:** <Why this altitude and why not simpler/more complex>
