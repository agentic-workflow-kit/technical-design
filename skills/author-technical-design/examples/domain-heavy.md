# Technical Design — Payment Processing System

**Status:** Settled
**Round:** 2

## 1. Architecture Altitude

**Chosen Altitude:** Tactical DDD with Ports & Adapters (Hexagonal)

**Why simpler is insufficient:**
Payment processing involves strict invariants, complex state transitions (Pending -> Authorized -> Captured/Failed), and interactions with multiple external gateways. A simple layered architecture would quickly lead to logic bleeding across layers and an inability to test business rules in isolation.

**Why more complex is unnecessary:**
We don't need full CQRS or Event Sourcing at this time, as the read volume is low and auditability is handled by the payment gateway and basic audit tables.

## 2. Boundaries & Boundary Rules

**Allowed Dependencies:**
- Infrastructure and App layers depend on the Domain layer.

**Forbidden Dependencies (Boundary Rules):**
- `no-domain-to-infra`: Domain layer MUST NOT import Infrastructure layer (e.g. DB models, HTTP clients).
- `no-domain-to-api`: Domain layer MUST NOT import API layer (e.g. Controllers, framework routers).

## 3. Use-Case Slices
### Use Case: Authorize Payment
**Trigger:** `POST /payments/authorize`
**Primary Actor:** The checkout service.
**Preconditions:**
- Order must be valid and customer must be authenticated.
**Main Flow:**
1. API layer receives request and maps to Command.
2. App layer handles Command and retrieves Payment Aggregate from Repository.
3. Aggregate executes `authorize` logic (checking invariants).
4. App layer calls Payment Gateway Adapter (via Port).
5. App layer saves updated Aggregate.
**Alternative/Error Flows:**
- Payment Gateway timeout -> Circuit breaker trips, return 503.
- Insufficient funds -> Aggregate enforces invariant, returns Domain Error.
**Invariants & State:**
- Payment can only transition to Authorized if current state is Pending.

## 4. Failure & Consistency Model
**Dependencies & Failure Modes:**
- Payment Gateway -> Timeouts handled via circuit breaker and delayed retry queue.

**Consistency:**
- Idempotency keys are REQUIRED on all write endpoints.
- Eventual consistency for downstream analytics via published Domain Events.

## 5. Risks & Deferred Decisions
- D-004: Deferred adding a dedicated retry queue for gateway timeouts; currently relying on synchronous retries with backoff.
