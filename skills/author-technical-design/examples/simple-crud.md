# Technical Design — User Profile Service

**Status:** Settled
**Round:** 1

## 1. Architecture Altitude

**Chosen Altitude:** MVC / Layered Architecture

**Why simpler is insufficient:**
We need basic separation between the HTTP controllers and the database queries to allow testing the queries independently of the web framework.

**Why more complex is unnecessary:**
This service is just a simple CRUD API over a `users` table. There are no complex domain rules, state transitions, or cross-aggregate invariants to protect. Introducing Tactical DDD (Entities, Value Objects, Aggregates) or Ports & Adapters would be severe over-engineering.

## 2. Boundaries & Boundary Rules

**Allowed Dependencies:**
- Controllers can import Services/Models.

**Forbidden Dependencies (Boundary Rules):**
- Models MUST NOT import Controllers.

## 3. Use-Case Slices
### Use Case: Update User Profile
**Trigger:** `PUT /users/:id/profile`
**Primary Actor:** The authenticated user.
**Preconditions:**
- User must exist and be authenticated.
**Main Flow:**
1. Validate input payload.
2. Update the `users` table record for the given ID.
3. Return the updated record.
**Alternative/Error Flows:**
- User not found -> Return 404
- Invalid payload -> Return 400
**Invariants & State:**
- Email addresses must be unique.

## 4. Failure & Consistency Model
**Dependencies & Failure Modes:**
- Database down -> Return 500.

**Consistency:**
- Strong consistency via simple relational DB transaction.

## 5. Risks & Deferred Decisions
- Scalability to millions of users deferred until necessary.
