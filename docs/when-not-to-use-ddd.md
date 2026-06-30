# Avoiding DDD Theater

The pack is DDD-first, but that does not mean every design gets full tactical DDD. The failure mode is
not "using DDD"; the failure mode is applying DDD vocabulary without real ownership, invariants, or
enforceable boundaries.

## Strategic DDD is always useful

Even simple work should name:

- The bounded context or context area.
- What it owns, reads, and explicitly does not own.
- The core language the team should use.
- The boundary between domain behavior, persistence, delivery, and external systems.

## Tactical DDD must earn its place

Add aggregates, value objects, domain events, anti-corruption layers, sagas, CQRS, or event sourcing
only when the design has matching complexity:

- Strict invariants that must never be bypassed.
- State transitions governed by business rules.
- Rich policy decisions before persistence.
- Multiple actors changing the same conceptual state.
- External systems whose vocabulary should not leak into the domain.
- Consistency or audit needs that require explicit event history.

## Simpler work still gets DDD discipline

For a CRUD-like feature, use `ddd_depth: strategic-only`. Keep the context, ownership, vocabulary,
boundary, and tests explicit. Do not create fake aggregates or repositories just to look tactical.

## Event sourcing is not the default

Event sourcing is a persistence and history strategy, not a replacement for DDD in v1. Treat it as a
future DDD subprofile when audit, replay, temporal queries, or durable event history are real
requirements.
