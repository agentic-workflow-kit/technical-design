# Kubernetes Sidecar Containers Brief

## Goal

Design the Kubernetes sidecar-container lifecycle behavior as a runtime lifecycle/state-machine
surface. The design must explain how restartable init containers behave without inventing a new
workload API or treating sidecars as ordinary app containers.

## Source Facts

| ID        | Fact                                                                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `SRC-001` | Kubernetes implements sidecar containers as a special case of init containers; they remain running after Pod startup.                             |
| `SRC-002` | A sidecar-style init container uses `restartPolicy: Always` in `.spec.initContainers`.                                                           |
| `SRC-003` | Sidecar containers keep init-container ordering guarantees: after a sidecar has started, kubelet starts the next init container in order.         |
| `SRC-004` | Sidecars can be started, stopped, or restarted independently of app containers and other init containers.                                         |
| `SRC-005` | On Pod termination, kubelet postpones sidecar termination until main app containers stop, then shuts sidecars down in reverse spec order.          |
| `SRC-006` | In Jobs, a sidecar-style init container does not prevent Job completion after the main container finishes.                                        |
| `SRC-007` | Sidecars may affect Pod readiness through readiness probes.                                                                                      |
| `SRC-008` | Resource accounting treats sidecars as running with regular containers and with init-container ordering effects.                                  |
| `SRC-009` | This fixture does not add a new workload API, replace Pods, or require ordinary app containers to be converted into sidecars.                     |

## Constraints

- Prefer `architecture_mode: lifecycle/state-machine`.
- Use strategic lifecycle/state depth, not tactical DDD aggregate ceremony.
- Preserve compatibility and failure concerns around restart behavior, termination ordering, Jobs,
  readiness, and resources.
