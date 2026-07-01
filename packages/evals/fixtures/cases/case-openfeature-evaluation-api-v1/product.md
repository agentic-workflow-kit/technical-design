# OpenFeature Evaluation API Brief

## Goal

Design the OpenFeature evaluation API seam as a vendor-agnostic flag-evaluation contract. The design
must keep the API and provider responsibilities clear without making OpenFeature own a flag
management UI, business rules, or application product behavior.

## Source Facts

| ID        | Fact                                                                                                                                         |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `SRC-001` | The evaluation API evaluates feature flag values independently of any flag control plane or vendor.                                           |
| `SRC-002` | If no provider is configured, the evaluation API uses a no-op provider that returns the supplied default flag value.                          |
| `SRC-003` | Providers perform flag evaluations and abstract the SDK from the underlying flag management system.                                           |
| `SRC-004` | A provider may wrap a vendor SDK, call a bespoke flag-evaluation REST API, or resolve values from local data.                                 |
| `SRC-005` | Providers are set through the evaluation API, and provider changes affect OpenFeature clients.                                                |
| `SRC-006` | Hooks extend flag evaluation at lifecycle stages such as before, after, error, and finally.                                                   |
| `SRC-007` | Before hooks can affect evaluation context before resolution; after hooks run after successful resolution; error hooks run on abnormal flow.   |
| `SRC-008` | Provider events report configuration and initialization state such as ready, error, configuration changed, and stale.                         |
| `SRC-009` | This fixture excludes flag-management UI, authoring rule workflows, audit workflows, and application business decisions.                      |

## Constraints

- Prefer `architecture_mode: ports-and-adapters`.
- Use low tactical DDD depth. This is a contract/API seam, not a domain aggregate lifecycle.
- The design must distinguish evaluation API resolution from provider backend integration.
