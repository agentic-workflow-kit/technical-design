# Grader Notes

## Case Purpose

case_type: tiny_contract
primary_capability: Preserve small scheduling invariants, required APIs, lifecycle events, and explicit non-goals from a compact product brief.
secondary_capability: Confirm that low-ceremony design still names a booking-lifecycle owner while treating resident verification, appliance/hold facts, and notification triggers as source facts.
what_this_case_must_not_test: Do not grade tactical DDD richness, shared-package behavior, external payment systems, dynamic pricing, rewards, or a preferred decomposition beyond the source-visible ownership split.
required_deterministic_blockers: overlapping active bookings, multiple active bookings per resident, missing lifecycle states, missing public APIs, missing 30-minute cancellation cutoff, invented billing/pricing/payment/rewards scope, or assigning scheduling conflict ownership to Identity.
acceptable_design_alternatives: Booking Scheduling, Laundry Scheduling, or Scheduling may own booking lifecycle and invariants; Identity, Catalog, Appliance Availability, Resident Eligibility, Resident Verification, and Notification Delivery are acceptable decomposition choices but are not required standalone contexts.
bad_candidate_snippets: "Billing owns laundry payment collection"; "Dynamic Pricing owns washer surge prices"; "Identity owns scheduling conflict logic"; "Residents may keep multiple active bookings"; "Notification Delivery owns Booking state transitions".
future_adjustment_notes: Keep this case small. Add only source-visible invariant, API, or non-goal checks that are needed for deterministic regression coverage.

This case intentionally uses simple text evidence. It is not a semantic judge and should not decide
whether a bounded-context decomposition is elegant. It only verifies that a candidate preserves the
source-backed facts needed before later model-graded evals exist.

Do not add facts from `reference-design.md` unless they already appear in `product.md` or
`source-map.md`.
