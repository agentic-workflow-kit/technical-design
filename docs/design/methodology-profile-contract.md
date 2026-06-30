# Methodology Profile Contract

The five skills are the stable shell. Methodology-specific behavior lives in `methodologies/<name>/`.
The active v1 profile is `ddd`.

## Required profile files

Each profile must include:

- `README.md` - what the methodology means in this pack and when to use it.
- `templates/technical-design.md` - the main authoring shape.
- `templates/enforcement-map.md` - how design boundaries become enforceable rules.
- `review-rubric.md` - review dimensions and blocking conditions.
- `enforcement-rules.md` - rule types the enforcement skill can translate.
- `eval-expectations.md` - fixtures and failures that prove the methodology works.

## Stable interface

Skills consume the profile through these concepts:

- **Frame output:** source map, assumptions, blockers, context candidates, complexity drivers, and
  selected methodology depth.
- **Author output:** a design document with methodology frontmatter, context/boundary sections,
  behavior sections, failure/consistency model, enforcement map, delivery inputs, and a
  methodology-neutral `Planner Handoff Summary` that satisfies
  [`technical-design-handoff-contract.md`](technical-design-handoff-contract.md).
- **Review output:** structured suggestions with `lens`, `evidence`, `gate_ref`, `lesson_ref`, and
  `decision_ref`.
- **Enforcement output:** generated rules plus seeded violation evidence for every declared rule.

## Planning handoff preservation

Every methodology profile must preserve the planner-facing handoff contract, even when its internal
authoring vocabulary is not DDD. The profile must produce:

- top-level `design_id`, `handoff_contract`, methodology, status, and round fields;
- stable IDs for source references and planner-facing facts;
- explicit context, boundary, invariant, API/surface, failure, observability, enforcement, and
  delivery-planning facts;
- sequencing, dependency, file-contention, validation, and stop-condition facts;
- review guidance that treats a blank, prose-only, or methodology-private handoff as blocking.

The profile may add or rename methodology-specific sections, but Planning consumes the handoff
contract rather than the profile's private concepts.

## Adding a future profile

Add a new folder under `methodologies/`, implement the required files, add eval fixtures, and update
only references to the active default. Do not rename the five skills or move generic flow behavior
into the methodology profile.
