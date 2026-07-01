# Case Rubric

The deterministic grader checks explicit fact and boundary evidence only. A candidate design should
be considered blocked when it:

- allows overlapping active bookings for one appliance;
- lets a resident hold multiple active bookings;
- omits the booking lifecycle;
- omits the 30-minute cancellation rule;
- assigns scheduling conflict decisions to Identity;
- introduces billing, pricing, rewards, or payment ownership as in-scope behavior.

Alternative wording is acceptable when the same source-backed fact is preserved. `Identity`,
`Catalog`, and `Notifications` are acceptable decomposition choices, not mandatory standalone
contexts.
