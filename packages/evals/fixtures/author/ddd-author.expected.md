# Author Eval - DDD Technical Design

## Input

A problem frame with `ddd_depth: ports-and-adapters`, source map, Payment Processing context, external
provider webhook, idempotency invariant, and fulfillment integration.

## Expected output properties

- Frontmatter includes:
  - `methodology: ddd`
  - `methodology_version`
  - `design_status`
  - `ddd_depth`
  - `design_id`
  - `handoff_contract: technical-design-handoff-v0`
- Includes a `Planner Handoff Summary` with stable source, context/boundary, invariant,
  API/surface, failure, observability, enforcement, delivery, sequencing, file-contention,
  validation, and stop-condition IDs.
- Includes source and context audit.
- Includes input sufficiency and ownership resolution for required product inputs, with missing
  ownership decisions captured as safe assumptions, user-approved decisions, or blocking questions.
- Includes bounded context owns/reads/does-not-own.
- Includes ubiquitous language.
- Includes invariant matrix with source operands.
- Includes ports/adapters and public API section.
- Includes data/query/consistency, failure, observability, migration/deploy, testing, and delivery
  inputs.
- Includes enforcement map where every forbidden rule has `seededViolation`.
