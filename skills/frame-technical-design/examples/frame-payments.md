# Problem Frame

> Intake artifact for DDD-first technical design. It records source evidence, InputResolution,
> AgreedSystemModel, architecture mode, and initial depth before authoring.

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

## 3. InputResolution

| Required input | Source evidence | Resolution | Owner / impact | Approval status |
|---|---|---|---|---|
| webhook scope and provider payload | payment webhook brief | provided | Payment Processing owns intake decision | approved |
| fulfillment idempotency owner | missing | requires approval | changes whether Payment Processing emits a command or calls fulfillment port | pending |
| retry policy | payment webhook brief gap | safe assumption | treat retries as provider-driven webhook retries until product says otherwise | not required |

## 4. AgreedSystemModel

| Entity | Responsibilities | Owns | Reads | Does Not Own |
|---|---|---|---|---|
| Provider Webhook Adapter | verify provider signature, receive payload, translate provider vocabulary | raw provider payload acceptance | provider event ID, amount, order id | fulfillment execution |
| Payment Processing | deduplicate events, update payment state, emit accepted payment fact | payment event intake, payment state, idempotency key | order id, amount, fulfillment eligibility | checkout intent creation |
| Fulfillment | fulfill paid order once | fulfillment execution and fulfillment idempotency if approved | accepted payment fact | provider retries |

### Relations

| From | Relation | To | Notes |
|---|---|---|---|
| Provider Webhook Adapter | calls | Payment Processing | adapter translates provider payload into internal command |
| Payment Processing | emits | Fulfillment | pending approval on whether this is a command or event |

### Seams and External Boundaries

- Provider webhook boundary between external provider vocabulary and internal payment command.
- Fulfillment seam between accepted payment fact and downstream fulfillment execution.

### Lifecycle and State Terms

- pending -> paid -> fulfillment-triggered.
- duplicate provider event stays paid and must not trigger fulfillment twice.

### Mode and Depth

- **architecture_mode:** ports-and-adapters
- **initial ddd_depth:** ports-and-adapters

### Open Questions and Approval

- Pending approval: fulfillment idempotency owner.

## 5. Assumptions and Blockers

### Safe Assumptions
- Webhook handling can acknowledge receipt before asynchronous processing.
- Raw payload should be stored for audit and replay.

### Blocking Questions
- Which component owns fulfillment idempotency? The answer changes whether this context emits a command
  or directly calls a fulfillment port.

## 6. DDD Context Candidates

| Candidate context | Owns | Reads | Does Not Own | Open ownership question |
|---|---|---|---|---|
| Payment Processing | payment event intake, payment state, idempotency key | order id, amount, fulfillment eligibility | fulfillment execution, checkout intent creation | who owns fulfillment idempotency |

## 7. Complexity Drivers

- **Invariants:** A payment event should trigger fulfillment at most once.
- **State transitions:** pending -> paid -> fulfillment-triggered; paid must not return to pending.
- **Integrations:** provider webhook, fulfillment system.
- **Consistency:** webhook retries require idempotency and raw event storage.
- **Security and authorization:** verify provider signature before accepting event.
- **Migration/deploy:** add processed event table and idempotency index.
- **Observability:** event received, event deduplicated, fulfillment trigger requested, processing failed.
- **Testing:** signature verification tests, idempotency tests, architecture boundary test.

## 8. Architecture Mode and Initial DDD Depth

**Selected architecture_mode:** ports-and-adapters

**Selected depth:** ports-and-adapters

**Why this depth fits:** External provider vocabulary and fulfillment integration need clear ports and
anti-corruption boundaries. The state machine is strict but not yet rich enough to require many
aggregates.

**Where tactical depth is intentionally omitted:** No event-sourced aggregate or CQRS read model in v1.

## 9. Handoff to Author

- **Design artifact target:** `technical-design.md`
- **Required methodology profile:** `ddd`
- **Approval status:** blocked pending fulfillment idempotency owner approval.
- **Delivery constraints to preserve:** source payment state and failure tokens before implementing
  webhook consumers.
