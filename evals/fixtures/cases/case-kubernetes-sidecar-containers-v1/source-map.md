# Source Map

| ID        | Type | Reference                                                                                                               | Establishes                                         |
| --------- | ---- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `SRC-001` | docs | `https://kubernetes.io/docs/concepts/workloads/pods/sidecar-containers/`                                                | Sidecars are restartable init containers.           |
| `SRC-002` | docs | `https://kubernetes.io/docs/concepts/workloads/pods/sidecar-containers/`                                                | `restartPolicy: Always` under `initContainers`.     |
| `SRC-003` | docs | `https://kubernetes.io/docs/concepts/workloads/pods/sidecar-containers/`                                                | Ordered init-container startup semantics.           |
| `SRC-004` | docs | `https://kubernetes.io/docs/concepts/workloads/pods/sidecar-containers/`                                                | Independent start, stop, and restart behavior.      |
| `SRC-005` | docs | `https://kubernetes.io/docs/concepts/workloads/pods/sidecar-containers/`                                                | Pod termination ordering for sidecars.              |
| `SRC-006` | docs | `https://kubernetes.io/docs/concepts/workloads/pods/sidecar-containers/#jobs-with-sidecar-containers`                   | Job completion behavior.                            |
| `SRC-007` | docs | `https://kubernetes.io/docs/concepts/workloads/pods/sidecar-containers/`                                                | Readiness probe participation.                      |
| `SRC-008` | kep  | `https://github.com/kubernetes/enhancements/blob/master/keps/sig-node/753-sidecar-containers/README.md`                 | Resource accounting and KEP rationale.              |
| `SRC-009` | brief | `product.md#source-facts`                                                                                             | New workload API and ordinary app-container non-goal. |
