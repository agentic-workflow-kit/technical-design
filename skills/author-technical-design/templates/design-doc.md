# Technical Design — <design name>

**Status:** Draft | Settled
**Round:** 1

## 1. Architecture Altitude

**Chosen Altitude:** <CRUD | Layered | Use-case slices | Ports & Adapters | Tactical DDD>

**Why simpler is insufficient:**
<Explain why the next level down cannot handle the complexity drivers.>

**Why more complex is unnecessary:**
<Explain why the next level up would be over-engineering.>

## 2. Boundaries & Boundary Rules

**Allowed Dependencies:**
- <e.g., App layer depends on Domain>

**Forbidden Dependencies (Boundary Rules):**
- <e.g., Domain layer MUST NOT import Infrastructure or API layers>

## 3. Use-Case Slices
<List the use cases using the use-case-slice.md template>

## 4. Failure & Consistency Model
**Dependencies & Failure Modes:**
- <e.g., Database timeout -> Retry with exponential backoff>
- <e.g., Third party API down -> Fallback or circuit breaker>

**Consistency:**
- <e.g., Eventual consistency for search index updates, idempotency keys for retried writes>

## 5. Risks & Deferred Decisions
- <Known gaps, technical debt, or risks to track>
