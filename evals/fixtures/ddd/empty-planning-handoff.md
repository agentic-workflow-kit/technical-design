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
  that names, or explicitly marks `None` with source-backed rationale, every required handoff
  category: `SRC`, `CTX`, `INV`, `SURF`, `FAIL`, `OBS`, `ENF`, `DEL`, `SEQ`, `FILE`, `VAL`, and
  `STOP`.

## Required Fix

Add a Planner Handoff Summary that names every required category, or explicitly marks a category
None with source-backed rationale: SRC, CTX, INV, SURF, FAIL, OBS, ENF, DEL, SEQ, FILE, VAL, STOP.
