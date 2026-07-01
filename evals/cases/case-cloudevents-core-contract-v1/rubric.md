# Case Rubric

The deterministic grader checks that the candidate preserves CloudEvents as a small contract seam.
A candidate should be blocked when it:

- omits interoperability across services, platforms, and systems;
- collapses context attributes and domain payload data into one owned domain object;
- omits JSON/event-format support;
- omits structured and binary message modes;
- invents Kafka, broker ownership, an event store, or event-sourcing lifecycle as required scope.

Good designs may call the boundary `CloudEvents Contract`, `Event Contract`, or similar. They should
avoid tactical DDD ceremony unless it is explicitly framed as unnecessary.
