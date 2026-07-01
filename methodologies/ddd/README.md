# DDD Methodology Profile

This is the active v1 methodology profile for `technical-design`.

## Default stance

Use DDD for every design at the strategic level, but select `architecture_mode` before `ddd_depth`.
For some designs the first useful model is a system-entity model, lifecycle/state machine,
control-plane/runtime shape, ports/adapters seam, or contract/seam map. DDD then makes the resulting
ownership, language, boundaries, and invariants explicit.

Strategic DDD covers:

- Bounded contexts and ownership.
- Ubiquitous language.
- Invariants and state transitions.
- Domain/application/infrastructure boundaries.
- Explicit consistency and failure models.

Choose tactical depth per context:

- `strategic-only` - ownership and language are useful, but no rich domain model is needed.
- `use-case-slices` - behavior is mostly procedural but needs clear commands, errors, and tests.
- `ports-and-adapters` - the domain must be isolated from concrete databases, SDKs, queues, or
  delivery mechanisms.
- `tactical-ddd` - aggregates, value objects, domain events, and transaction boundaries are needed.

## Required artifacts

When this profile is active, `author-technical-design` must produce:

- Planner-facing frontmatter: `design_id`, `handoff_contract`, methodology, status, and round.
- DDD frontmatter: `methodology`, `methodology_version`, `design_status`, `ddd_depth`.
- A `Planner Handoff Summary` that satisfies
  `docs/design/technical-design-handoff-contract.md`.
- `InputResolution`, `AgreedSystemModel`, `architecture_mode`, and `DocStructurePlan` approval
  evidence before durable design docs.
- Source/context audit and assumptions/blockers.
- Context map with owns/reads/does-not-own.
- Ubiquitous language.
- Commands/use cases and domain behavior.
- Invariant matrix with source operands.
- Ports/adapters and public API boundaries.
- Failure, consistency, observability, migration/deploy, and testing sections.
- Enforcement map and delivery inputs.

## Non-goals

- No DDD base classes.
- No framework-specific folder template.
- No event sourcing by default.
- No private app-specific examples or repository names.
