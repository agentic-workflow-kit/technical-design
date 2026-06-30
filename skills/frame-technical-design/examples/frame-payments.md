# Problem Frame

> Intake artifact for technical design. Captures the scope, complexity drivers, and resolved unknowns before choosing an architecture altitude.

## 1. Scope & Context

- **Source:** PRD-payments-stripe.md
- **Goal:** Implement a payment webhook processor that listens for Stripe events, updates our internal order status, and triggers fulfillment.
- **Out of Scope:** Creating the initial payment intent (handled by frontend checkout), handling refunds.

## 2. Complexity Drivers

> These drivers inform the architecture altitude. If these are heavy, we may need tactical DDD or ports/adapters. If they are light, CRUD/layered is best.

- **Invariants:** An order must only be fulfilled exactly once, even if Stripe sends duplicate webhook events.
- **State Transitions:** Order status transitions: `Pending` -> `Paid` -> `FulfillmentTriggered`. Cannot go `Paid` -> `Pending`.
- **Integrations:** Stripe (incoming webhooks), internal Fulfillment Service (outgoing RPC).
- **Consistency Needs:** Must not lose webhook events. Idempotency is critical.
- **Scale / Non-functional:** Webhooks must return 200 OK to Stripe within 2 seconds.

## 3. Clarifying Questions & Unknowns

| Question | Status | Answer / Safe Assumption |
|----------|--------|--------------------------|
| Should we queue the webhooks or process them synchronously? | [Answered] | Queue them. Return 200 to Stripe immediately, process asynchronously to avoid timeout. |
| What if the fulfillment service is down? | [Assumed] | We will retry asynchronously with exponential backoff. |
| Do we need to store the raw Stripe payload? | [Answered] | Yes, for audit and replay purposes. |

## 4. Altitude Recommendation

**Initial Leaning:** Use-Case Slices with Ports/Adapters for external services.
**Rationale:** The need for idempotency, async processing, and third-party integration (Stripe, Fulfillment) makes simple CRUD insufficient. However, the domain logic itself (updating status to Paid) is thin, so full tactical DDD (aggregates, domain events) is over-engineering. Explicit boundaries around the Stripe adapter and Fulfillment adapter are needed.
