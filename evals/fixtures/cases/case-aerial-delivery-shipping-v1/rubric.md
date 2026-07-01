# Case Rubric

The deterministic grader should focus on explicit source-backed ownership and constraints, not on
whether the candidate design is the most elegant decomposition.

A candidate should be treated as blocked when it:

- omits business enrollment or pickup-request initiation;
- omits drone assignment, ETA, or active tracking behavior;
- hides Shipping or Drone Management instead of recognizing them as core subdomains;
- collapses Delivery and Delivery History into one ownership boundary;
- assigns scheduling decisions to Ingestion or Accounts;
- assigns long-term history ownership to Delivery;
- invents fixed account internals, regulatory workflows, exact APIs, or production safety policy as if the sources required them.

Equivalent wording is acceptable when it preserves the same source-backed facts and boundaries.
`Package`, `Scheduler`, and `Supervisor` can be standalone services or explicit internal
sub-boundaries. `Ingestion` is a valid optional buffering pattern, but it must not own scheduling
decisions.
