# DDD Eval - Source-Invisible Handoff Fact

## Defect

The Planner Handoff Summary states `SURF-001` will expose `ReservationConfirmed` and marks the design
ready for planning, but the fact cites no `SRC-*` row and the event does not appear in the visible
product brief, source map, approved system model, or decision log. The only rationale is "from prior
planning experience."

## Expected review finding

- `lens`: `architecture-enforceability`
- `dimension`: `delivery-inputs`
- `severity`: `blocking`
- `lesson_ref`: `LSN-017`
- Required fix: cite a visible product, design, source, or decision reference for the planner-facing
  fact, or remove it from the planning-ready handoff.
