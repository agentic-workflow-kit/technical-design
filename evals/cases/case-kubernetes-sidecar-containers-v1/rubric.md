# Case Rubric

The deterministic grader checks lifecycle semantics. A candidate should be blocked when it:

- treats Kubernetes sidecars as ordinary app containers;
- omits `initContainers` and `restartPolicy: Always`;
- omits init-container ordering;
- says sidecars must finish before Pod termination or before main containers stop;
- omits Job completion behavior;
- invents a new workload API as selected scope.

Good designs use lifecycle/state-machine language and name compatibility/resource/failure concerns
without turning kubelet behavior into tactical DDD aggregates.
