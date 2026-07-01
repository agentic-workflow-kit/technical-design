# Reference Design: CloudEvents Core Contract

This reference is a comparison anchor, not an exact-output target.

## Architecture Mode

Use `contract/seam design` with strategic-only DDD depth. CloudEvents is an interoperability contract
for event metadata, data, and formats, not a business workflow that needs aggregates or repositories.

## Contexts

- Event Contract owns CloudEvents context attributes, event data separation, structured-mode and
  binary-mode message semantics, and JSON event-format compatibility.
- Domain Event Producers own the meaning and lifecycle of domain payload data.
- Transport Adapters carry messages from source to destination but do not own CloudEvents semantics,
  domain payload meaning, or broker-specific policy in this fixture.

Event Contract reads producer payload schemas and transport constraints. Domain Event Producers read
the CloudEvents contract when creating interoperable messages.

## Required Contract

CloudEvents preserves interoperability across services, platforms, and systems. Context attributes
identify event metadata and relationships, while event data remains the domain-specific payload. A
design must keep those surfaces separate instead of merging them into one vague domain object.

The contract supports event formats that serialize CloudEvents as bytes. JSON event-format support
is required, including top-level serialized attributes. Structured mode carries the whole event in
the message body. Binary mode keeps event data in the body and maps event attributes to message
metadata. Batch mode can be discussed as an event-format capability, but it is not required as a
broker feature.

Kafka, queue ownership, event-store persistence, retry systems, schema registries, and event-sourcing
lifecycles remain out of scope.
