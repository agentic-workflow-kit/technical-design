# Grader Notes

## Case Purpose

case_type: ddd_heavy
primary_capability: Preserve loan-account lifecycle, charge invariants, transaction dates, accounting, and business events in a tactical DDD case.
secondary_capability: Confirm the design keeps loan product template ownership separate from loan account state and excludes underwriting scope.
what_this_case_must_not_test: Do not model all of Fineract, client onboarding, savings, standing instructions, full accounting configuration, product authoring, or credit underwriting.
required_deterministic_blockers: product/account ownership collapse, missing lifecycle commands, missing repayment/write-off/foreclosure transaction dates, missing loan charge API split, unrestricted charge mutation after approval, accounting/business events treated as UI-only state, or invented underwriting/credit-scoring scope.
acceptable_design_alternatives: Loan Account Lifecycle may be named Loan Account Management or Loan Servicing if it owns transitions and transactions. Loan Charges may be an internal sub-boundary if charge validation and commands remain explicit. Accounting may be an integration context if journal/accrual ownership is clear.
bad_candidate_snippets: "charge mutation after approval is unrestricted"; "Loan Account Lifecycle owns product configuration"; "loan product and loan account are the same aggregate"; "Underwriting owns approval decision"; "Credit Scoring owns loan lifecycle"; "business events are UI-only state"; "journal entries are just UI state".
future_adjustment_notes: Keep the fixture scoped to one loan lifecycle slice. Add only source-visible lifecycle, transaction, charge, accounting, or business-event expectations.

This case is intentionally more tactical than the other new cases. It should reward tactical depth
only when tied to source-visible state transitions and invariants.
