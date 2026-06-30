# Reference Heuristics

This document contains reusable design heuristics extracted from common domain-driven design practices, distilled to their essence for use when architecting solutions. Use these to judge whether a design is appropriately rigorous or over-engineered.

## 1. Guarding vs. Validating
- **Validating** is filtering: It happens at the boundary (e.g., the API controller or input DTO). It rejects bad input with a 400 Bad Request. It's expected that external input can be bad.
- **Guarding** is failing fast: It happens inside the domain model (e.g., inside an entity or value object). By the time data reaches the domain, it is assumed to be valid. A guard violation means the system itself has a bug (a 500 Internal Server Error) or a domain rule was broken (domain exception).

## 2. Make Illegal States Unrepresentable
Instead of relying on comments or runtime checks to ensure a user has either an email or a phone, encode it in the type system.
*Bad:* `interface Contact { email?: string; phone?: string; }` (allows neither)
*Good:* `type Contact = Email | Phone | [Email, Phone]` (compiler enforces valid state)

## 3. Domain Invariants
Invariants are rules that must always hold true in a specific context. An entity should never be allowed to exist in an invalid state.
- A wallet balance cannot be less than 0.
- An order must have at least one line item.
Enforce invariants in constructors and mutations. Do not allow "empty" objects to be instantiated and filled later if that violates the invariant.

## 4. Value Objects and Primitives
Avoid "primitive obsession" where business concepts are just strings or numbers. 
If an `email` has specific validation rules, create an `Email` value object. If a `money` amount has a currency and a value, create a `Money` value object. 
*Note on Altitude:* Only apply this when the logic justifies it. In a simple CRUD app, `string` for an email is fine if the framework's input validation handles it.

## 5. Explicit Domain Errors
Instead of throwing generic technical exceptions, use explicit error types for expected domain failures (e.g., `UserAlreadyExistsError`, `InsufficientFundsError`). This forces consumers to handle them and prevents the API layer from leaking stack traces.

## 6. Architecture Enforcement
Intent is fragile; CI checks are durable. Define boundaries (e.g., "Domain cannot depend on Infrastructure") and enforce them with tools like `dependency-cruiser` or `eslint`. If the boundary is breached, the build should fail.
