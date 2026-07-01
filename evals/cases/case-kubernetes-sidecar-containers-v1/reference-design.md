# Reference Design: Kubernetes Sidecar Containers

This reference is a comparison anchor, not an exact-output target.

## Architecture Mode

Use `lifecycle/state-machine` with strategic-only DDD depth. The source describes kubelet and Pod
lifecycle semantics, not domain aggregates.

## Boundaries

- Pod Lifecycle owns Pod startup, termination sequencing, Job completion interpretation, readiness,
  and resource accounting for sidecar containers.
- Init Container Sequencing owns ordered evaluation of `.spec.initContainers` and the rule that the
  next init container starts after a sidecar-style init container has started.
- Sidecar Runtime owns restartable init-container behavior for entries with `restartPolicy: Always`.

No new workload API is selected in this fixture. Regular app containers remain separate from
sidecar-style init containers.

## Required Lifecycle

A Kubernetes sidecar container is modeled as a special init container that remains running after Pod
startup. It is declared in `.spec.initContainers` with `restartPolicy: Always`. Because it is still
in the init container list, it keeps ordering guarantees: after the sidecar has started, kubelet can
start the next init container in order.

The sidecar can be started, stopped, or restarted independently of app containers and other init
containers. Readiness probes on sidecars can contribute to Pod readiness.

During Pod termination, kubelet waits for main app containers to stop before terminating sidecars,
then shuts sidecars down in reverse spec order. For Jobs, the sidecar does not block Job completion
after the main container finishes.

Resource accounting must include sidecars running with regular containers and account for
init-container ordering effects.
