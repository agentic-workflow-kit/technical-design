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
  behavior sections, failure/consistency model, enforcement map, and delivery inputs.
- **Review output:** structured suggestions with `lens`, `evidence`, `gate_ref`, `lesson_ref`, and
  `decision_ref`.
- **Enforcement output:** generated rules plus seeded violation evidence for every declared rule.

## Adding a future profile

Add a new folder under `methodologies/`, implement the required files, add eval fixtures, and update
only references to the active default. Do not rename the five skills or move generic flow behavior
into the methodology profile.
