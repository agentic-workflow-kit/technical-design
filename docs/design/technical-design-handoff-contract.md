# Technical-Design Handoff Contract

This contract defines the design document surface that the Planning layer consumes from
`technical-design`. It is methodology-neutral: DDD is the active authoring profile, but Planning must
not need DDD internals to understand the approved design input.

## Contract Posture

This is a document-format contract, not a frozen JSON Schema. A technical design must preserve the
required fields, sections, fact categories, IDs, and invariants below. Exact Markdown table wording,
additional methodology sections, and storage encoding may evolve as long as a downstream planner can
extract the same facts without interpreting methodology-specific prose.

The canonical planner-facing section is `Planner Handoff Summary`. Methodology-specific sections may
contain deeper reasoning, but the handoff summary is the contract surface. The handoff is not ready
until the design records approval of the pre-authoring artifacts: `InputResolution`,
`AgreedSystemModel`, and `DocStructurePlan`.

## Fact Closure and Proof Posture

Planner-facing facts are useful only when a later reader can reconstruct them from visible sources.
Every non-`None` handoff fact must have source closure. Core `CTX-*`, `INV-*`, `SURF-*`, `FAIL-*`,
`OBS-*`, `ENF-*`, and `DEL-*` facts cite `SRC-*` rows directly. Derived `SEQ-*`, `FILE-*`, `VAL-*`,
and `STOP-*` facts may cite those source-backed fact IDs when the source chain is reconstructable in
the same handoff; otherwise they cite `SRC-*` rows directly. Hidden prior-art references, private
methodology vocabulary, or "the implementation will decide" are not valid sources.

Facts that introduce produced obligations need an owner:

- `SURF-*` facts name the public surface, the producing context or adapter, intended consumers, and
  the exposure proof such as an export/import test, contract test, route test, or manual exposure
  checklist.
- `FAIL-*` and `OBS-*` facts name the producer-owned token, event, audit record, metric, log, or
  trace shape. Consumers cite those shapes; they do not mint stronger or different vocabulary.
- `INV-*` facts name every predicate operand as a declared field, event, projection, state, or
  resolver output, not as a broad category.
- `ENF-*` and `VAL-*` facts state the proof substrate: runtime test, type/compile fixture, static
  rule, seeded violation, documentation review, or manual-only review. A coverage or enforcement
  claim that runs over no matching substrate is not evidence.

## Required Pre-Authoring Artifacts

Every design intended for Planning must preserve these artifacts as sections or referenced files:

| Artifact | Required content |
|---|---|
| `InputResolution` | Required inputs classified as `provided`, `safe assumption`, `requires approval`, or `blocked`; approval decisions for any input that can change ownership, lifecycle, API scope, invariants, enforcement, or delivery slicing. |
| `AgreedSystemModel` | Source inputs used, unresolved required inputs, high-level system entities, responsibilities per entity, relations, ownership/reads/does-not-own, seams and external boundaries, lifecycle/state terms, open questions, `architecture_mode`, initial methodology depth, and approval status. |
| `DocStructurePlan` | Approved docs tree, responsibility of each file, why the shape fits the system model, what stays out, per-file status such as overview/stub/contract/decision-log/archive, and approval status. |

Diagrams are optional. When present, they must trace to approved entities, flows, lifecycles, or
boundaries and must not introduce architecture without a recorded decision.

## Required Top-Level Fields

Every design intended for Planning must include frontmatter with:

| Field | Required meaning |
|---|---|
| `design_id` | Stable slug for the design. It must not change between review rounds unless the design is split or replaced. |
| `handoff_contract` | Contract identifier. Current value: `technical-design-handoff-v0`. |
| `methodology` | Authoring methodology profile, such as `ddd`. |
| `methodology_version` | Version of the methodology profile used to author the design. |
| `architecture_mode` | Primary framing lens selected before methodology depth. Current allowed values: `system-entity-model`, `lifecycle/state-machine`, `ports-and-adapters`, `control-plane/runtime`, `contract/seam design`, `strategic-ddd`, `tactical-ddd`. |
| `design_status` | Lifecycle status, such as `draft`, `reviewed`, `approved`, or `superseded`. |
| `round` | Review/update round number. |

Methodology profiles may require additional fields. The active DDD profile also requires `ddd_depth`.

## Stable IDs

Planner-facing facts must have stable IDs. IDs are unique within a design and should stay stable once
reviewed or cited. If a fact is removed, mark it superseded in the design history or decision log
rather than reusing the ID for a different fact.

Use these prefixes unless a future profile supplies an equivalent documented mapping:

| Prefix | Fact type |
|---|---|
| `SRC-` | Source, product, PRD, issue, or design reference. |
| `CTX-` | Context, ownership, or boundary fact. |
| `INV-` | Invariant, predicate, lifecycle, or state-transition fact. |
| `SURF-` | Public API, port, adapter, event, command, data, or integration surface. |
| `FAIL-` | Failure mode, failure token, degraded behavior, or recovery fact. |
| `OBS-` | Event, metric, log, audit record, or traceability fact. |
| `ENF-` | Test, static rule, seeded violation, manual review gate, or standing enforcement fact. |
| `DEL-` | Candidate story area or implementation slice. |
| `SEQ-` | Sequencing, dependency, parallelism, or ordering constraint. |
| `FILE-` | File-contention or shared-surface constraint. |
| `VAL-` | Validation command, evidence expectation, or acceptance gate. |
| `STOP-` | Stop condition that sends work back to design or owner decision. |

## Required Planner Handoff Summary

Every approved design must include `## Planner Handoff Summary` with the sections below. A section may
state `None` only when the design gives a short source-backed reason. Blank tables, unchecked
checkboxes, or "TBD" values are not valid handoff data.

### Handoff Identity

The identity section names the design as an input artifact:

| Field | Required data |
|---|---|
| Design ID | Matches frontmatter `design_id`. |
| Handoff contract | Matches frontmatter `handoff_contract`. |
| Design title | Human-readable title. |
| Status | Current planning eligibility status. |
| Methodology profile | Profile and version used to author the design. |
| Review round | Current round. |

### Source and Product References

The design must list the source material Planning may cite:

| ID | Type | Reference | Required for Planning | Notes |
|---|---|---|---|---|
| `SRC-001` | `prd`, `brief`, `issue`, `source`, `design`, or `decision` | Path, URL, or stable artifact reference | What fact or constraint Planning must preserve | Optional context |

When Product layer PRD and acceptance-criteria IDs exist, designs should cite those IDs here instead
of inventing product identifiers locally. The source references should also identify the approved
`InputResolution`, `AgreedSystemModel`, `DocStructurePlan`, and decision-log entries that control the
design.

### Required Planning Facts

The handoff must summarize the facts Planning needs, each with an ID and direct source reference. The
summary can point to methodology sections for details, but it cannot require Planning to infer the
fact from prose.

| ID | Category | Required content |
|---|---|---|
| `CTX-*` | Context and boundary | Ownership, reads, does-not-own boundaries, and dependency direction. |
| `INV-*` | Invariant and lifecycle | Guarded predicate, state transition, source operands, and owning authority. |
| `SURF-*` | API and surface | Public exports, commands, ports, adapters, events, data surfaces, consumers, producer authority, and exposure proof. |
| `FAIL-*` | Failure | Failure modes, producer-owned tokens, degraded behavior, retries, and recovery authority. |
| `OBS-*` | Observability | Producer-owned event, metric, log, audit, or trace record the implementation must emit or preserve. |
| `ENF-*` | Enforcement | Static rule, test, seeded violation, manual review gate, proof substrate, or reason a rule is manual-only. |
| `DEL-*` | Delivery planning | Candidate story area, implementation boundary, expected outcome, and design facts it must preserve. |

### Sequencing, Contention, Validation, and Stops

The handoff must state implementation constraints that affect a future execution plan. These derived
facts may cite source-backed fact IDs such as `DEL-*`, `ENF-*`, `CTX-*`, or `INV-*`, provided the
source chain remains visible in the handoff.

| ID | Category | Required content |
|---|---|---|
| `SEQ-*` | Sequencing and dependency | Producer-before-consumer constraints, story dependencies, parallelizable work, and ordering risks. |
| `FILE-*` | File contention | Shared files, high-conflict surfaces, generated artifacts, migrations, or `None` with rationale. |
| `VAL-*` | Validation | Commands, checks, review gates, seed expectations, and evidence a planner should request. |
| `STOP-*` | Stop condition | Conditions that should halt implementation and return to owner/design before proceeding. |

### Methodology-Specific Detail

The handoff summary must distinguish required planner-facing facts from methodology-specific authoring
detail. For DDD, bounded contexts, ubiquitous language, invariant matrices, ports/adapters, and
tactical model choices are authoring detail unless summarized into the fact categories above.

Planning may read those sections for context, but it must be able to construct story candidates,
dependencies, validation expectations, and stop conditions from the planner-facing summary alone.

## Methodology-Neutral Requirements

Any future methodology profile must preserve:

- the top-level identity fields, including `design_id` and `handoff_contract`;
- stable planner-facing fact IDs with source references;
- explicit context, boundary, invariant, API/surface, failure, observability, enforcement, and
  delivery-planning facts;
- sequencing, dependency, file-contention, validation, and stop-condition facts;
- a way to distinguish required handoff data from methodology-specific reasoning;
- review guidance that marks missing, blank, or prose-only handoff facts as blocking;
- validation or fixture coverage that proves an empty handoff cannot be treated as planning-ready.

A profile may rename internal sections, replace DDD concepts, or add richer artifacts, but it cannot
make Planning learn that profile's private vocabulary to extract the required facts.

## Review and Validation Guidance

A design is not ready for Planning when:

- `InputResolution`, `AgreedSystemModel`, or `DocStructurePlan` is missing, unapproved, or
  contradicted by the authored docs;
- required frontmatter fields are missing or inconsistent with the handoff identity;
- a handoff section is blank, says only "see above", or contains broad prose with no stable IDs;
- authored sections introduce new entities, seams, lifecycle states, diagrams, or planner facts that
  are not in the approved system model or recorded as accepted decisions;
- planner-facing facts lack direct or transitive source closure, or cite only methodology-private
  sections that Planning would have to interpret;
- public surfaces, produced records, failure tokens, or observability events lack a producer/source
  authority and exposure or emission proof;
- invariant predicates omit one operand source or cite an input category instead of concrete fields,
  states, events, projections, or resolver outputs;
- any `DEL-*` story area lacks source, boundary, validation, or stop-condition references;
- enforcement claims omit a standing gate, seeded violation, or manual-only rationale;
- validation expectations are only "run tests" without naming the command, evidence class, and proof
  substrate;
- sequencing, dependencies, file contention, or stop conditions are omitted without a rationale;
- methodology-specific sections contain the only copy of a required planner-facing fact.

Static checks should keep the contract document, active template, and fixture present. Review fixtures
should include at least one prose-only or empty handoff case so the review rubric catches vacuous
planning readiness.
