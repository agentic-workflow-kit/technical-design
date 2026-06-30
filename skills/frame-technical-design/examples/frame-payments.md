# Problem Frame

> Intake artifact for DDD-first technical design. It records source evidence, assumptions, blockers,
> context candidates, and initial depth before authoring.

## 1. Scope and Goal

- **Source request:** payment webhook processing brief.
- **Goal:** Process provider webhooks, update internal payment state, and trigger downstream
  fulfillment exactly once.
- **Out of scope:** creating payment intents, refunds, settlement reconciliation.

## 2. Source Map

| Source | Authority | Establishes | Gaps / stale risk |
|---|---|---|---|
| payment webhook brief | authoritative | scope, external provider, fulfillment trigger | no retry policy specified |
| existing order status model | supporting | current state names | does not define payment failure tokens |

## 3. Assumptions and Blockers

### Safe Assumptions
- Webhook handling can acknowledge receipt before asynchronous processing.
- Raw payload should be stored for audit and replay.

### Blocking Questions
- Which component owns fulfillment idempotency? The answer changes whether this context emits a command
  or directly calls a fulfillment port.

## 4. DDD Context Candidates

| Candidate context | Owns | Reads | Does Not Own | Open ownership question |
|---|---|---|---|---|
| Payment Processing | payment event intake, payment state, idempotency key | order id, amount, fulfillment eligibility | fulfillment execution, checkout intent creation | who owns fulfillment idempotency |

## 5. Complexity Drivers

- **Invariants:** A payment event should trigger fulfillment at most once.
- **State transitions:** pending -> paid -> fulfillment-triggered; paid must not return to pending.
- **Integrations:** provider webhook, fulfillment system.
- **Consistency:** webhook retries require idempotency and raw event storage.
- **Security and authorization:** verify provider signature before accepting event.
- **Migration/deploy:** add processed event table and idempotency index.
- **Observability:** event received, event deduplicated, fulfillment trigger requested, processing failed.
- **Testing:** signature verification tests, idempotency tests, architecture boundary test.

## 6. Initial DDD Depth

**Selected depth:** ports-and-adapters

**Why this depth fits:** External provider vocabulary and fulfillment integration need clear ports and
anti-corruption boundaries. The state machine is strict but not yet rich enough to require many
aggregates.

**Where tactical depth is intentionally omitted:** No event-sourced aggregate or CQRS read model in v1.

## 7. Handoff to Author

- **Design artifact target:** `technical-design.md`
- **Required methodology profile:** `ddd`
- **Delivery constraints to preserve:** source payment state and failure tokens before implementing
  webhook consumers.
