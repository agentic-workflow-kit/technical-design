# Technical-Design Handoff Contract

This contract defines the design document surface that the future Planning layer consumes from
`technical-design`. It is methodology-neutral: DDD is the active authoring profile, but Planning must
not need DDD internals to understand the approved design input.

## Contract Posture

This is a document-format contract, not a frozen JSON Schema. A technical design must preserve the
required fields, sections, fact categories, IDs, and invariants below. Exact Markdown table wording,
additional methodology sections, and storage encoding may evolve as long as a downstream planner can
extract the same facts without interpreting methodology-specific prose.

The canonical planner-facing section is `Planner Handoff Summary`. Methodology-specific sections may
contain deeper reasoning, but the handoff summary is the contract surface.

## Required Top-Level Fields

Every design intended for Planning must include frontmatter with:

| Field | Required meaning |
|---|---|
| `design_id` | Stable slug for the design. It must not change between review rounds unless the design is split or replaced. |
| `handoff_contract` | Contract identifier. Current value: `technical-design-handoff-v0`. |
| `methodology` | Authoring methodology profile, such as `ddd`. |
| `methodology_version` | Version of the methodology profile used to author the design. |
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

When a future Product layer defines PRD and acceptance-criteria IDs, designs should cite those IDs
here instead of inventing product identifiers locally.

### Required Planning Facts

The handoff must summarize the facts Planning needs, each with an ID and source. The summary can point
to methodology sections for details, but it cannot require Planning to infer the fact from prose.

| ID | Category | Required content |
|---|---|---|
| `CTX-*` | Context and boundary | Ownership, reads, does-not-own boundaries, and dependency direction. |
| `INV-*` | Invariant and lifecycle | Guarded predicate, state transition, source operands, and owning authority. |
| `SURF-*` | API and surface | Public exports, commands, ports, adapters, events, data surfaces, and consumers. |
| `FAIL-*` | Failure | Failure modes, tokens, degraded behavior, retries, and recovery authority. |
| `OBS-*` | Observability | Event, metric, log, audit, or trace record the implementation must emit or preserve. |
| `ENF-*` | Enforcement | Static rule, test, seeded violation, manual review gate, or reason a rule is manual-only. |
| `DEL-*` | Delivery planning | Candidate story area, implementation boundary, expected outcome, and design facts it must preserve. |

### Sequencing, Contention, Validation, and Stops

The handoff must state implementation constraints that affect a future execution plan:

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

- required frontmatter fields are missing or inconsistent with the handoff identity;
- a handoff section is blank, says only "see above", or contains broad prose with no stable IDs;
- any `DEL-*` story area lacks source, boundary, validation, or stop-condition references;
- enforcement claims omit a standing gate, seeded violation, or manual-only rationale;
- validation expectations are only "run tests" without naming the command or evidence class;
- sequencing, dependencies, file contention, or stop conditions are omitted without a rationale;
- methodology-specific sections contain the only copy of a required planner-facing fact.

Static checks should keep the contract document, active template, and fixture present. Review fixtures
should include at least one prose-only or empty handoff case so the review rubric catches vacuous
planning readiness.
