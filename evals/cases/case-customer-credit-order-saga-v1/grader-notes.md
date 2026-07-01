# Grader Notes

## Case Purpose

case_type: state_machine_lifecycle
primary_capability: Preserve the orchestration-based order saga lifecycle, source-native states, rejection reasons, and service-local persistence model.
secondary_capability: Prove ownership separation between Ordering, Customer Credit, and Messaging and Integration Infrastructure.
what_this_case_must_not_test: Do not grade choreography, CQRS read-model design, shared-package extraction, generic event sourcing, or a provider abstraction.
required_deterministic_blockers: missing PENDING-to-reserveCredit flow, missing APPROVED/REJECTED/UNKNOWN_CUSTOMER/INSUFFICIENT_CREDIT outcomes, blurred Ordering versus Customer Credit ownership, Messaging owning business state or policy, or shared database/distributed transaction/2PC claims.
acceptable_design_alternatives: Order Service, Ordering, or Order Management may name the order-side boundary; Customer Service, Customer Credit, or Credit Management may name the credit authority; Eventuate Tram or Saga Messaging Infrastructure may name the transport boundary.
bad_candidate_snippets: "Customer Credit owns order rejection reason"; "Messaging and Integration Infrastructure owns order state"; "Messaging owns credit policy"; "The design uses 2PC for consistency between Order Service and Customer Service"; "Customer Service and Order Service share one database transaction".
future_adjustment_notes: Preserve source-native Order Service and Customer Service wording where it proves the same ownership and persistence facts.

This case is anchored to the orchestration-based Eventuate Tram Customers and Orders example. Grade
only explicit evidence that preserves the source-backed responsibilities, flow, outcomes, and
contradictions.

Do not treat the reference design as the only valid decomposition. It is a comparison anchor only.
`Ordering` and `Customer Credit` are evaluator aliases over the source-native `Order Service` and
`Customer Service` responsibilities, not preferred answer-key names.

Do not accept choreography-based event exchange, CQRS-specific read models, or shared-database
transaction assumptions unless the candidate clearly marks them as out of scope or contradictions.

Do not add facts from `reference-design.md` unless they are already grounded in `product.md` or
`source-map.md`.
