# Case Rubric

The deterministic grader checks that a candidate treats the Fineract slice as lifecycle- and
invariant-heavy. A candidate should be blocked when it:

- collapses loan product templates and loan account lifecycle ownership;
- omits lifecycle commands for approval, rejection, withdrawal, undo approval, or disbursement;
- ignores repayment/write-off/foreclosure transaction dates;
- misses the charge product versus loan-account charge API split;
- treats charges as freely mutable after approval or outside validation;
- treats accounting and business events as UI-only state;
- invents underwriting, credit-scoring, or client-onboarding scope.

Good designs may use tactical DDD terms such as aggregate, command, domain event, and invariant when
they are tied to visible loan-account lifecycle facts.
