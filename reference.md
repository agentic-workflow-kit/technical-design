# Reference Heuristics

These heuristics support the DDD-first profile. They are not a framework and should not be copied as
base classes.

## Guarding vs validating

- **Validating** happens at system boundaries. External input can be malformed.
- **Guarding** happens inside domain behavior. A guard failure means a domain rule or system invariant
  was violated.

Designs should state which rules are boundary validation and which rules are domain invariants.

## Make illegal states unrepresentable where it pays off

Use types, value objects, discriminated states, or constructor guards when they prevent real domain
bugs. Do not create tactical artifacts for concepts that have no behavior beyond basic persistence.

## Owns, reads, does not own

Every bounded context should state:

- what facts, decisions, data, and behavior it owns;
- what it reads from other contexts or systems;
- what nearby concerns belong elsewhere.

This prevents a later implementer from choosing ownership under pressure.

## Producer and source closure

Every produced field, event, state, failure token, or public symbol needs one source of authority. A
consumer can cite a producer-owned shape; it must not invent one.

## Predicate operand closure

For relational rules such as "inside workspace", "broader than", "contained by", or "matches policy",
name both operands as declared fields, events, projections, or resolver outputs.

## Public exposure is evidence

A public API exists only when the design names the public surface and the standing proof: export line,
import test, contract test, or equivalent.

## Enforcement needs a seed

A generated boundary rule is production-ready only when a seeded violation proves the gate fails for
that rule. Without a seed, the rule is a claim, not evidence.
