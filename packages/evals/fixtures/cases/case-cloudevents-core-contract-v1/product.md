# CloudEvents Core Contract Brief

## Goal

Design a small contract-first event surface for producing and consuming CloudEvents-compatible
messages. The design must preserve interoperability across services, platforms, transports, and
storage without inventing a broker product or event-sourcing lifecycle.

## Source Facts

| ID        | Fact                                                                                                                                           |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `SRC-001` | CloudEvents defines a common event metadata and structure model for interoperability across services, platforms, and systems.                   |
| `SRC-002` | A CloudEvent has context attributes used by tools and application code to identify relationships between events and system occurrences.         |
| `SRC-003` | Event data is domain-specific payload information about the occurrence and is distinct from CloudEvent context attributes.                      |
| `SRC-004` | Event formats serialize CloudEvents as bytes; standalone formats such as JSON are independent of protocol or storage medium.                   |
| `SRC-005` | Every event format defines structured-mode representation and may define batch-mode representation.                                             |
| `SRC-006` | Messages transport events from a source to a destination; structured mode puts the whole event in the message body, while binary mode separates event data from metadata. |
| `SRC-007` | The JSON event format defines how CloudEvents attributes and data are represented in JSON, including top-level serialized attributes.           |
| `SRC-008` | This fixture does not select Kafka, a queue, event store, retry system, schema registry, or event-sourcing domain lifecycle.                   |

## Constraints

- Prefer `architecture_mode: contract/seam design`.
- Use low tactical DDD depth. The source is a specification seam, not a rich domain workflow.
- The first design should name the event contract owner, the JSON/event-format surface, and the
  separation between context attributes and domain payload data.
