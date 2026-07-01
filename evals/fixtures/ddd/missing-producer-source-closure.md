# DDD Eval - Missing Producer/Source Closure

## Defect

The design says adapters and downstream planners consume `booking-window-expired`, but no context,
catalog, source artifact, or decision owns that failure token. The token appears first in a consumer
failure table, and the Source and Producer Closure section is missing.

## Expected review finding

- `lens`: `architecture-enforceability`
- `dimension`: `public-api`
- `severity`: `blocking`
- `lesson_ref`: `LSN-018`
- Required fix: name the single producer/source authority for every consumed public surface, produced
  record, failure token, observability event, or catalog value.
