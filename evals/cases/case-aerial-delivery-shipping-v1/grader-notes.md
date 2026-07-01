# Grader Notes

## Case Purpose

case_type: ddd_heavy
primary_capability: Preserve a multi-context DDD decomposition with source-visible operational delivery, history, scheduling, package, supervision, account, and drone-management ownership.
secondary_capability: Catch collapsed delivery/history ownership and unsupported drone telemetry, fleet-status, account-internal, regulatory, exact-API, or production flight-safety inventions.
what_this_case_must_not_test: Do not grade Azure article recall, exact reference-design wording, production flight operations, drone regulatory workflows, account internals, exact public APIs, or private implementation details.
required_deterministic_blockers: missing business enrollment and pickup workflow, missing drone assignment, missing ETA/current-location tracking, hidden Shipping or Drone Management core subdomains, collapsed Delivery and Delivery History, Ingestion owning scheduling decisions, Accounts owning delivery scheduling, or Delivery owning long-term history.
acceptable_design_alternatives: Account and Drone may be reached directly or through shipping-facing services; Package, Scheduler, and Supervisor can be named as separate aggregates/services or clearly owned internal Shipping sub-boundaries when the source-backed ownership evidence remains local and explicit; Ingestion is optional request-buffering evidence, not a required context.
bad_candidate_snippets: "Delivery owns long-term delivery history"; "Ingestion owns scheduling decisions"; "Accounts owns delivery scheduling"; "Drone Management owns delivery history"; "Shipping owns drone fleet policy"; "Telemetry owns fleet status and drone regulatory workflow for this fixture".
future_adjustment_notes: Package, Scheduler, and Supervisor remain deterministic only as source-backed ownership evidence, not as mandatory standalone service shapes. Ingestion remains an optional buffering pattern plus contradiction guard; keep it out of required boundaries unless future sources make it mandatory.

This case is grounded in Microsoft Learn's drone-delivery example, but the fixture only grades the
paraphrased facts committed here. It should not reward answers merely for echoing Azure article
phrasing, and it should not penalize alternate bounded-context names when the same ownership split
is explicit.

The Supervisor boundary is intentionally narrow. The allowed sources establish monitoring for
failures or timeouts, but they do not justify a full recovery-policy design.

Do not add facts from `reference-design.md` unless the same fact already appears in `product.md` or
`source-map.md`.
