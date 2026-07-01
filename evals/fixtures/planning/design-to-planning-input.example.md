# Design-to-Planning Input Fixture

This fixture shows the contract surface Planning consumes. The `Planner Handoff Summary` is required
handoff data. The DDD-specific detail below is context that authors and reviewers use, but Planning
must not need to parse DDD internals to build story candidates.

---
design_id: payment-webhook-idempotency
handoff_contract: technical-design-handoff-v0
methodology: ddd
methodology_version: "1"
design_status: reviewed
ddd_depth: ports-and-adapters
round: 2
---

# Technical Design - Payment Webhook Idempotency

## Planner Handoff Summary

### Handoff Identity

| Field | Value |
|---|---|
| Design ID | `payment-webhook-idempotency` |
| Handoff contract | `technical-design-handoff-v0` |
| Design title | Payment Webhook Idempotency |
| Status | Reviewed, ready for planning |
| Methodology profile | `ddd@1`, `ports-and-adapters` depth |
| Review round | 2 |

### Source and Product References

| ID | Type | Reference | Required for Planning | Notes |
|---|---|---|---|---|
| `SRC-001` | brief | `docs/product/payment-webhooks.md` | Preserve the product promise that provider retries do not create duplicate fulfillment. | Product-layer PRD IDs are not available yet. |
| `SRC-002` | source | `src/payments/webhook-handler.ts` | Existing webhook entry point and provider payload shape. | Implementation reference. |
| `SRC-003` | decision | `decisions.md#D-002` | Accepted tradeoff: idempotency is guarded before fulfillment dispatch. | Round 2 decision. |

### Required Planning Facts

| ID | Category | Required handoff data | Source/fact refs |
|---|---|---|---|
| `CTX-001` | Context and boundary | Payment Webhooks owns provider event acceptance, idempotency checks, and the accepted/rejected webhook decision. Fulfillment reads accepted payment events but does not own provider retry handling. | `SRC-001`, `SRC-003` |
| `INV-001` | Invariant and lifecycle | A provider event ID can produce at most one accepted payment event. Operands: provider event ID from webhook payload and prior acceptance record in the payment store. | `SRC-001`, `SRC-002` |
| `SURF-001` | API and surface | Public surface is `POST /webhooks/payment-provider`; domain code depends on `PaymentEventStorePort`, not the provider SDK or HTTP framework. | `SRC-002` |
| `FAIL-001` | Failure | Duplicate provider event returns duplicate-accepted response without dispatching fulfillment again. Store write conflict maps to `payment-webhook-conflict` and is retried by the webhook adapter only when the port reports retryable conflict. | `SRC-001`, `SRC-003` |
| `OBS-001` | Observability | Emit an audit record for accepted, duplicate, rejected, and conflict outcomes with redacted provider event ID hash and decision reason. | `SRC-001` |
| `ENF-001` | Enforcement | Add a port-boundary import rule with a seeded violation proving domain code cannot import provider SDK or HTTP framework modules. | `SRC-002` |
| `DEL-001` | Delivery planning | Story candidate: introduce payment-event idempotency port and invariant tests before changing the webhook adapter. Preserves `CTX-001`, `INV-001`, and `ENF-001`. | `SRC-001`, `SRC-002` |
| `DEL-002` | Delivery planning | Story candidate: adapt the existing webhook handler to call the port, map duplicate/conflict outcomes, and emit audit records. Preserves `SURF-001`, `FAIL-001`, and `OBS-001`. | `SRC-002`, `SRC-003` |

### Sequencing, Contention, Validation, and Stops

| ID | Category | Required handoff data | Source/fact refs |
|---|---|---|---|
| `SEQ-001` | Sequencing and dependency | `DEL-001` must land before `DEL-002` because adapter behavior depends on the port contract and invariant tests. The stories are not parallelizable. | `DEL-001`, `DEL-002` |
| `FILE-001` | File contention | `src/payments/webhook-handler.ts` is shared with provider-auth work; serialize changes touching that file. | `SRC-002` |
| `VAL-001` | Validation | Expected evidence: unit tests for duplicate and conflict cases, import-boundary seed failure, and `pnpm check`. | `INV-001`, `ENF-001` |
| `STOP-001` | Stop condition | Stop and return to design if fulfillment must synchronously call provider APIs, because that changes context ownership and failure authority. | `CTX-001`, `FAIL-001` |

## Methodology-specific detail

The following DDD sections are authoring and review context. They are not the primary Planning
contract, though their facts are summarized above.

### Context Map

| Context | Owns | Reads | Does Not Own |
|---|---|---|---|
| Payment Webhooks | Provider event acceptance, idempotency decision, accepted/rejected event emission. | Provider payload, prior acceptance record. | Fulfillment lifecycle, provider account setup. |
| Fulfillment | Shipment or entitlement dispatch after accepted payment event. | Accepted payment event. | Provider retries, provider payload parsing. |

### Invariant and State Matrix

| Invariant / Predicate | Source operands | Enforced by | Failure token |
|---|---|---|---|
| Provider event ID accepted at most once | provider event ID, prior acceptance record | Payment Webhooks context through `PaymentEventStorePort` | `payment-webhook-conflict` |

### Ports, Adapters, and Public API

| Surface | Type | Owner | Consumers | Enforcement |
|---|---|---|---|---|
| `PaymentEventStorePort` | domain port | Payment Webhooks | webhook adapter | import-boundary rule with seeded violation |
| `POST /webhooks/payment-provider` | HTTP adapter | Payment Webhooks | provider | route test and webhook signature fixture |
