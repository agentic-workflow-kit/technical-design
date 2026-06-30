---
name: enforce-architecture
description: 'Use when a user wants to enforce architecture boundaries, generate dependency-cruiser or ESLint boundary rules, run enforce-architecture, or convert a settled DDD technical design enforcement map into TS-first CI gates. Requires seeded violations for declared rules so enforcement cannot pass vacuously.'
---

# enforce-architecture

Turn a settled design's enforcement map into executable TS-first architecture checks.

## References

- DDD enforcement map template: `../../methodologies/ddd/templates/enforcement-map.md`
- DDD enforcement rules: `../../methodologies/ddd/enforcement-rules.md`
- Generator script: `scripts/generate_depcruise.mjs`

## Preconditions

- The design is settled: no open blocking review suggestions.
- The design has an enforcement map, or explicitly says there are no enforceable boundaries.
- Every declared rule has a seeded violation path or equivalent fixture.

## Anti-vacuous rule

Generate rules only for boundaries explicitly declared by the design. If the design has no enforceable
boundaries, say so and produce a manual review checklist instead of pretending CI proves the design.

If the design declares a rule but has no seed, stop and ask for a seeded violation fixture. A rule is
not production-ready until the gate can be shown to fail for that exact rule.

## Output

1. Extract the design's enforcement map into `layer-map.json`.
2. Verify each `forbidden` rule has `from`, `to`, `reason`, and `seededViolation`.
3. Run `node scripts/generate_depcruise.mjs layer-map.json --output .dependency-cruiser.js`.
4. Run the generated config against the seed fixture and confirm the expected failure.
5. Generate ESLint guidance only when the design's layer structure can support useful editor checks.
6. Output `ci-gate.md` with the command and expected failing seed evidence.

## Examples

- `examples/typescript-service.md` - DDD ports/adapters rule: domain must not import infrastructure.
- `examples/layered-mvc.md` - non-DDD folder taxonomy rule: model must not import controller.
- `examples/crud-no-boundaries.md` - strategic-only design with no enforceable import boundary; the
  skill declines a vacuous gate.
