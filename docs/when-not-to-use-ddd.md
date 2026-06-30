# When Not to Use Domain-Driven Design (DDD)

DDD is a powerful methodology for modeling complex business logic, but it is often misapplied to problems that don't warrant its overhead. 

## The Anti-Pattern: DDD by Default
Applying tactical DDD (Entities, Value Objects, Aggregates, Domain Events) to a simple CRUD application creates an "architecture theater." You end up with layers of mapping, verbose base classes, and repositories that do nothing but wrap a single SQL query—all for a service that just updates a database row.

## Complexity Drivers that Justify DDD
Only use tactical DDD if you can identify explicit complexity drivers during the framing stage:
- **Strict Invariants:** The domain has rules that must *never* be broken, and enforcing them requires keeping the entire object graph consistent in memory.
- **Complex State Transitions:** Entities don't just change from A to B; they follow strict state machines governed by business logic.
- **Rich Business Logic:** The application makes many decisions, calculations, and policy enforcements before writing data.
- **Highly Collaborative Domains:** Many actors are modifying the same data concurrently, requiring Aggregate Roots as transaction boundaries.

## The Alternative: Layered MVC
If your service simply validates input, reads a record, updates a field, and saves it:
- Use standard Model-View-Controller or a simple layered architecture.
- Depend on your framework's validation rules instead of creating Value Objects.
- Keep boundaries clean (e.g., controllers shouldn't contain SQL), but don't over-engineer the layers in between.

**Verdict:** The `author-technical-design` skill is instructed to explicitly decline DDD if the problem frame lacks sufficient complexity drivers.
