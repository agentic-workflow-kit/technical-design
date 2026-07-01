# Grader Notes

## Case Purpose

case_type: state_machine_lifecycle
primary_capability: Preserve Kubernetes sidecar-container lifecycle semantics as restartable init containers.
secondary_capability: Confirm runtime compatibility concerns around ordering, termination, Jobs, readiness, and resource accounting.
what_this_case_must_not_test: Do not grade implementation code in kubelet, detailed KEP rollout history, service mesh behavior, application-level sidecar patterns, or new workload API design.
required_deterministic_blockers: sidecars as ordinary app containers, missing restartPolicy Always, missing init-container ordering, wrong termination ordering, missing Job completion behavior, or invented workload API.
acceptable_design_alternatives: Pod Lifecycle, Kubelet Pod Lifecycle, Sidecar Runtime, Restartable Init Container Runtime, or Init Container Sequencing may own the lifecycle facts if the semantics remain source-correct.
bad_candidate_snippets: "sidecars are ordinary app containers"; "sidecars must finish before pod termination"; "sidecars terminate before main containers"; "SidecarWorkload API"; "new workload API is selected"; "containers field owns sidecar lifecycle".
future_adjustment_notes: Keep the case on lifecycle semantics. Do not add unrelated workload-controller behavior.

This case is intentionally not a DDD-rich domain case. Tactical aggregate or repository language is
usually evidence of over-design.
