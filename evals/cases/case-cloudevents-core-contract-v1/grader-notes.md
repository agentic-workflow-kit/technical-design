# Grader Notes

## Case Purpose

case_type: tiny_contract
primary_capability: Preserve a specification-level event contract without turning it into broker or event-sourcing design.
secondary_capability: Confirm that low-ceremony designs can still name the owner of context attributes, event data separation, and JSON/event-format compatibility.
what_this_case_must_not_test: Do not grade Kafka, queue topology, schema registry behavior, replay, event-store persistence, delivery retries, or tactical aggregate modeling.
required_deterministic_blockers: missing interoperability goal, missing context-versus-data separation, missing JSON/event-format support, missing structured/binary mode, invented broker ownership, or event-sourcing lifecycle.
acceptable_design_alternatives: Event Contract, CloudEvents Contract, Event Envelope Contract, or Interoperability Contract may own the specification seam. Transport adapters may carry messages if they do not own contract semantics.
bad_candidate_snippets: "Kafka owns CloudEvents delivery"; "CloudEvents defines event-sourcing lifecycle"; "context attributes and domain payload are one object"; "Event Store owns CloudEvents lifecycle"; "CloudEventEnvelope owns domain behavior".
future_adjustment_notes: Keep this case tiny. Add only source-visible event-format, message-mode, or non-goal checks.

Do not add deterministic requirements from CloudEvents extensions or protocol bindings unless those
sources are made visible in `product.md` and `source-map.md`.
