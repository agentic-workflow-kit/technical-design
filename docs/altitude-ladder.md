# The Altitude Ladder

Not every problem requires Domain-Driven Design (DDD). Architecture should match the complexity of the problem. Use this ladder to choose the right altitude for a technical design.

## 1. Simple CRUD / Anemic
- **When to use:** Data-centric applications. The software is mostly a view over a database. Logic is limited to basic validation (e.g., "is this a valid email?").
- **Structure:** Controllers -> Services -> Database Models.
- **Characteristics:** Entities are just data bags (getters/setters). No strict separation between domain and persistence models.

## 2. Layered (N-Tier)
- **When to use:** Standard business applications with moderate logic.
- **Structure:** Presentation (API) -> Business Logic -> Data Access.
- **Characteristics:** Dependencies point downwards. The business logic layer orchestrates the flow, but might still directly understand the shape of the database.

## 3. Ports and Adapters (Hexagonal)
- **When to use:** When you need strict isolation from external systems (databases, third-party APIs, message brokers).
- **Structure:** Core (Domain + Application) in the center. Ports (Interfaces) define how the core communicates. Adapters implement the ports.
- **Characteristics:** The core knows *nothing* about the delivery mechanism (HTTP, CLI) or the persistence mechanism (SQL, NoSQL).

## 4. Tactical DDD
- **When to use:** Highly complex domains with intricate business rules, state transitions, and strict invariants.
- **Structure:** Bounded Contexts, Aggregates, Entities, Value Objects, Domain Events.
- **Characteristics:** Behavior is rich and lives inside the entities. Aggregates act as transaction boundaries.

**Rule of Thumb:** Always start at Level 1 or 2. Only climb the ladder when the complexity drivers of the problem demand it. DDD is an opt-in module, not the default.
