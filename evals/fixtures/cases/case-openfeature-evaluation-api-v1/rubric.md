# Case Rubric

The deterministic grader checks that a candidate keeps OpenFeature as a low-ceremony API and
provider seam. A candidate should be blocked when it:

- omits vendor/control-plane independence;
- omits no-op/default provider behavior;
- blurs provider backend resolution with application business logic;
- omits hook lifecycle stages;
- omits provider events for readiness, error, configuration change, and stale state;
- invents flag-management UI, rule-authoring, audit, aggregate, or repository ownership.

Good designs use ports/adapters language and avoid tactical DDD unless clearly explaining why it is
unnecessary.
