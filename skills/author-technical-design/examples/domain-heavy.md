---
methodology: ddd
methodology_version: "1"
design_status: settled
ddd_depth: tactical-ddd
round: 2
---

# Technical Design - Payment Authorization

## 1. Source and Context Audit

| Source | Used for | Notes |
|---|---|---|
| Payment authorization brief | core workflow and gateway constraints | Requires idempotency and external provider isolation. |

## 2. Assumptions and Blockers

### Safe Assumptions
- Gateway responses are retriable when the provider reports timeout or unknown status.

### Blocking Questions
- None.

## 3. DDD Depth

**Selected depth:** tactical-ddd

**Why this depth is sufficient:** Payment authorization has strict lifecycle transitions,
idempotency, external provider language, and failure tokens consumed by downstream contexts.

**Where deeper tactical ceremony is unnecessary:** Event sourcing is not required because the payment
gateway and audit table provide enough history for v1.

## 4. Context Map

| Context | Owns | Reads | Does Not Own |
|---|---|---|---|
| Payment Authorization | authorization state, idempotency decisions, failure tokens | order total, customer payment method reference | order fulfillment, provider settlement |

## 5. Ubiquitous Language

| Term | Meaning | Owner |
|---|---|---|
| Authorization | Provider-approved hold on funds before capture | Payment Authorization |
| PaymentAttempt | One idempotent attempt to authorize a payment | Payment Authorization |

## 6. Domain Behavior

| Command / Use Case | Actor | Invariant guarded | Result |
|---|---|---|---|
| Authorize payment | checkout flow | pending attempt can authorize at most once per idempotency key | Authorized or Failed attempt |

## 7. Invariant and State Matrix

| Invariant / Predicate | Source operands | Enforced by | Failure token |
|---|---|---|---|
| attempt authorizes only from pending | PaymentAttempt.status, AuthorizePayment command | PaymentAttempt aggregate | payment-state-invalid |
| idempotency key is single-writer | command.idempotencyKey, stored attempt.idempotencyKey | authorization repository port | duplicate-payment-attempt |

## 8. Ports, Adapters, and Public API

| Surface | Type | Owner | Consumers | Enforcement |
|---|---|---|---|---|
| PaymentGatewayPort | domain/application port | Payment Authorization | provider adapter | port contract test |
| PaymentAttemptRepository | repository port | Payment Authorization | infrastructure adapter | no-domain-to-infrastructure |

## 9. Data, Query, and Consistency

- **Write model:** PaymentAttempt aggregate is the transaction boundary.
- **Read model:** status projection reads committed attempts.
- **Consistency:** strong for attempt state, eventual for analytics.

## 10. Failure, Observability, Migration, and Deploy

- **Failure modes:** gateway timeout, duplicate attempt, invalid transition.
- **Observability:** payment_authorization_requested, payment_authorization_completed,
  payment_authorization_failed.
- **Migration/deploy:** add payment_attempts table and idempotency key index.

## 11. Testing and Enforcement

| Claim | Proof | Standing gate |
|---|---|---|
| domain never imports infrastructure | seeded dependency violation | check:architecture |
| invalid transition fails closed | aggregate unit test | test |

### Enforcement Map

```json
{
  "layers": [
    { "name": "domain", "path": "src/domain" },
    { "name": "infrastructure", "path": "src/infrastructure" }
  ],
  "forbidden": [
    {
      "from": "domain",
      "to": "infrastructure",
      "reason": "Payment domain must depend on ports, not concrete persistence or provider SDKs.",
      "seededViolation": "src/domain/__architecture__/domain-imports-infrastructure.seed.ts"
    }
  ]
}
```

## 12. Delivery Inputs

- **Candidate story areas:** aggregate and tokens, gateway port, repository adapter, architecture gate.
- **Sequencing constraints:** aggregate and failure token catalog before adapters.
- **File contention:** public domain index and architecture config.
- **Validation expectations:** unit tests, contract tests, check:architecture.
- **Stop conditions:** stop if settlement or fulfillment behavior is pulled into this context.

## 13. Risks and Deferred Decisions

- D-004 deferred event sourcing until replay/audit requirements exceed the gateway plus audit table.
