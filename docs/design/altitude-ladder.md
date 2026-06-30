# DDD Depth Ladder

`technical-design` is DDD-first in v1. The choice is no longer whether to use DDD at all; the choice
is how much DDD depth the design needs.

## 1. Strategic-only DDD

- **Use when:** The work is mostly CRUD or glue, but still benefits from clear language and ownership.
- **Required:** bounded context name, owns/reads/does-not-own, ubiquitous language, simple use cases,
  boundary rules if layers exist.
- **Avoid:** fake aggregates, repositories that only wrap one query, domain events that no consumer
  needs.

## 2. DDD with use-case slices

- **Use when:** Behavior spans multiple steps but has limited lifecycle complexity.
- **Required:** commands/use cases, input/output contracts, domain errors, explicit validation versus
  guarding, test seams.
- **Avoid:** pushing behavior into an anemic service just because no aggregate exists yet.

## 3. DDD with ports and adapters

- **Use when:** The domain must be isolated from databases, provider SDKs, queues, HTTP frameworks, or
  other concrete infrastructure.
- **Required:** domain/application ports, adapter responsibilities, composition/wiring boundary,
  contract tests or mocks that are held to the real seam.
- **Avoid:** allowing adapters to define domain vocabulary or persistence models to leak inward.

## 4. Tactical DDD

- **Use when:** The domain has strict invariants, complex lifecycle transitions, rich policies,
  concurrency, or cross-context consistency.
- **Required:** aggregates or equivalent transaction boundaries, value objects where primitives are
  unsafe, domain events when another context consumes facts, failure-token catalogs, consistency model.
- **Avoid:** event sourcing or CQRS by reflex. Treat event sourcing as a future subprofile when audit,
  replay, temporal queries, or durable event history justify it.

## Rule of thumb

Always use strategic DDD. Increase tactical depth only where the complexity drivers demand it, and
record why deeper ceremony is unnecessary for the rest.
