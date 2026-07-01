# Grader Notes

## Case Purpose

case_type: negative_fit_low_ceremony
primary_capability: Preserve a low-ceremony OpenFeature evaluation API and provider-adapter design without inventing product-management domain scope.
secondary_capability: Confirm hook lifecycle and provider event state are visible without forcing tactical DDD.
what_this_case_must_not_test: Do not grade flag targeting semantics, vendor-specific SDK behavior, UI/rule editors, audit stores, or feature flag product management.
required_deterministic_blockers: missing vendor-agnostic evaluation API, missing no-op/default provider behavior, provider owning app business logic, missing hooks, missing provider events, invented flag-management UI/rules/audit scope, or FeatureFlag aggregate/repository as required design.
acceptable_design_alternatives: Evaluation API, Flag Evaluation API, Provider, Provider Adapter, Hook Pipeline, and Provider Events may be named differently if ownership remains clear.
bad_candidate_snippets: "OpenFeature owns flag management UI"; "FeatureFlag aggregate"; "FeatureFlagRepository"; "Provider owns application business logic"; "OpenFeature owns flag rules"; "OpenFeature owns audit workflow".
future_adjustment_notes: Keep the case focused on evaluation API seams. Do not add full flag-management product behavior.

This fixture should stay a negative-fit case for tactical DDD. A candidate that explicitly declines
aggregates and repositories should remain valid when it preserves the source facts.
