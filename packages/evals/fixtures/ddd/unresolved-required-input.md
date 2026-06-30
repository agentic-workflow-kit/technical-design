# Defect Fixture - Unresolved Required Input

## Input

A short product brief says residents can reserve laundry appliances and receive notification emails.
It does not say who owns resident verification, who produces appliance maintenance holds, whether
notifications can change booking state, or whether cancellation authority belongs to residents,
staff, or an automated policy.

## Defective Design Excerpt

| Context | Owns | Reads | Does Not Own |
|---|---|---|---|
| Identity | verified resident record and access checks | none | scheduling conflict logic |
| Catalog | appliance metadata and maintenance holds | none | booking lifecycle |
| Scheduling | booking lifecycle, overlap detection, cancellation rules | verified resident status, appliance metadata, maintenance holds | verified resident record |
| Notifications | outbound lifecycle messages | booking lifecycle events | booking state transitions |

The design marks the handoff ready for planning and does not list any safe assumptions or Blocking
Questions for the missing ownership inputs.

## Expected Review Signal

- severity: blocking
- lens: domain-correctness
- dimension: source-map
- lesson_ref: LSN-011
- gate_ref: DDD review rubric: A design assigns context ownership, lifecycle authority, public API scope, or invariant authority from missing product inputs without a safe assumption, blocking question, or accepted user decision.

## Required Fix

ask the user or record a blocking question before assigning ownership for missing required inputs
