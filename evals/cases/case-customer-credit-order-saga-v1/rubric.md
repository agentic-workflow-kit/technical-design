# Case Rubric

The deterministic grader checks explicit fact and boundary evidence only. A candidate design should
be considered blocked when it:

- merges Ordering and Customer Credit into one ownership boundary without preserving separate service
  responsibilities;
- assigns customer data, credit limit, or credit reservation decisions to Ordering;
- assigns order lifecycle state, rejection reason, or saga orchestration to Customer Credit;
- omits that order creation starts in `PENDING`;
- omits the `reserveCredit` command from Ordering to Customer Credit;
- omits `APPROVED`, `REJECTED`, `UNKNOWN_CUSTOMER`, or `INSUFFICIENT_CREDIT`;
- claims the services share one database transaction or rely on distributed transactions or `2PC`;
- introduces choreography-specific or CQRS-specific behavior as if it were required for this case.

Alternative wording is acceptable when the same source-backed fact is preserved.
