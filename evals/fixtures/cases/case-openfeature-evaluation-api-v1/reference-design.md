# Reference Design: OpenFeature Evaluation API

This reference is a comparison anchor, not an exact-output target.

## Architecture Mode

Use `ports-and-adapters` with strategic-only DDD depth. OpenFeature is an SDK and provider contract
for flag evaluation. It does not need a `FeatureFlag` aggregate or repository in this fixture.

## Boundaries

- Evaluation API owns vendor-agnostic flag evaluation, default-value behavior, no-op provider
  fallback, provider registration, and client-facing evaluation calls.
- Provider Adapter owns backend flag resolution behind the provider interface and hides whether it
  wraps a vendor SDK, a REST API, or local flag data.
- Hook Pipeline owns before, after, error, and finally hook execution around flag evaluation.
- Provider Events owns readiness, error, configuration-changed, and stale state notifications.

Application code owns application business decisions after it receives a flag value. A flag
management system owns rule authoring and control-plane data outside this fixture.

## Required Behavior

The evaluation API evaluates feature flag values independently of a flag control plane or vendor. If
no provider is configured, the no-op provider returns the supplied default value. A configured
provider performs flag evaluation through its backend adapter, but it does not own application
business behavior.

Hooks run at lifecycle stages around evaluation: before resolution, after successful resolution, on
error, and finally. Provider events report initialization and configuration state such as
`PROVIDER_READY`, `PROVIDER_ERROR`, `PROVIDER_CONFIGURATION_CHANGED`, and `PROVIDER_STALE`.

Flag-management UI, rule-authoring workflows, audit workflow, and application product decisions
remain out of scope.
