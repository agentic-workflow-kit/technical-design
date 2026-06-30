---
name: enforce-architecture
description: 'Use when a user wants to enforce architecture boundaries, setup dependency-cruiser, setup eslint boundaries, or run /enforce-architecture. Takes a settled design and generates dependency-cruiser and eslint configurations along with a CI gate command.'
---

# enforce-architecture

Turns a settled design's explicit boundaries into executable enforcement rules. Generates dependency-cruiser configurations based on the `layer-map` declared in the design.

## Preconditions
- The design must be settled (no open blocking suggestions).
- The design must contain explicit boundaries.

## Behavior (Anti-vacuous rule)
This skill generates rules *only* for boundaries that explicitly exist in the design's layer map. 
**If the chosen altitude has no separation to protect (e.g. CRUD/MVC with no domain layer), `enforce-architecture` must say so:** "no architectural boundaries to enforce at this altitude" and it must **not** emit rules against folders that don't exist. This prevents the CI gate from passing vacuously.

## Output
1. Extract the layers and forbidden boundaries into a `layer-map.json` file.
2. Run `node scripts/generate_depcruise.mjs layer-map.json --output .dependency-cruiser.js`.
3. Generate `eslint-boundaries.md` if ESLint rules are desired.
4. Output `ci-gate.md` with instructions to run the checks in CI.

## Examples
- `examples/typescript-service.md` — hexagonal/DDD altitude (rung 3): `domain ↛ infra`.
- `examples/layered-mvc.md` — layered altitude (rung 2): a NON-hexagonal rule (`model ↛ controller`), proving enforcement follows the design's declared layers, not a fixed taxonomy.
- `examples/crud-no-boundaries.md` — simple CRUD (rung 1): nothing to enforce; the skill declines rather than emitting a vacuous gate.
