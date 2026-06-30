# Principles of Technical Design

## 1. Start Simple
Complexity is a cost. Always default to the simplest architecture that solves the problem. A basic layered MVC app is superior to a poorly justified microservice with Domain-Driven Design ceremony.

## 2. Explicit Boundaries
The defining characteristic of good architecture is clear, enforced boundaries. Even in a simple application, the domain layer must not import the delivery mechanism (like an HTTP controller) or the database directly.

## 3. Review Proposes, User Disposes
Automated review should never silently edit a design. It should emit suggestions tagged with severity. The human user retains authority over what is accepted, rejected, or deferred.

## 4. Remember Why (Record Decisions)
Every accepted or rejected change during a design review must be recorded. A design document captures *what* we are building; the decision log (`decisions.md`) captures *why* we chose not to build it differently.

## 5. Intent Becomes Enforceable
A design document is useless if the code drifts from it immediately. The output of a settled design must include executable CI gates (like `dependency-cruiser` and ESLint rules) that enforce the agreed-upon boundaries.
