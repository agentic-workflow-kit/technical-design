# Defect Fixture - Prose-Only Planner Handoff

## Defect

The design claims it is ready for planning, but the handoff is broad prose with no stable IDs:

```md
## Planner Handoff Summary

This design is ready for planning. Use the DDD sections below to create implementation stories.
```

## Expected Review Signal

- severity: blocking
- lens: architecture-enforceability
- dimension: delivery-inputs
- lesson_ref: none
- gate_ref: DDD review rubric: A design marks ready for planning without a `Planner Handoff Summary`
  that names stable source, boundary, delivery, validation, and stop-condition IDs.

## Required Fix

Add a Planner Handoff Summary with stable source, boundary, delivery, validation, and stop-condition IDs.
