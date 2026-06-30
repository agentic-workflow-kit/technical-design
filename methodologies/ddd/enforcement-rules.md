# DDD Enforcement Rules

The DDD profile supports TS-first enforcement in v1.

## Rule types

- **Dependency direction:** one layer or context must not import another.
- **Public API exposure:** consumers import from a context's public surface, not internals.
- **Adapter isolation:** concrete SDKs, database clients, and framework objects stay outside domain
  code.
- **Type/catalog closure:** failure tokens, event types, and public state literals come from one
  producer-owned catalog when they need mechanical checking.

## Generated rules

`enforce-architecture` consumes the design's enforcement map and generates dependency-cruiser rules.
Each generated rule must have a seeded violation. If the design has no enforceable rule, the skill
must say so and produce a manual review checklist rather than a vacuous CI claim.

## Manual rules

Some DDD concerns are not reliable static-import checks:

- Whether the ubiquitous language is coherent.
- Whether an aggregate boundary is too wide.
- Whether eventual consistency is acceptable for a user-visible flow.

Keep these in the review rubric and testing strategy instead of pretending a static rule enforces
them.
