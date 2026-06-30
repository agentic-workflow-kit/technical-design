# Bounded Context - <context name>

## Purpose

<Why this context exists and what user/business outcome it protects.>

## Ownership

| Owns | Reads | Does Not Own |
|---|---|---|
| <facts/decisions/behavior/data> | <external facts consumed> | <nearby concerns owned elsewhere> |

## Language

| Term | Meaning |
|---|---|
| <term> | <meaning in this context> |

## Behavior

| Command / Policy | Invariant | Result |
|---|---|---|
| <command> | <rule> | <state/event/output> |

## Boundaries

- **Inbound:** <commands, API, event, user action>
- **Outbound:** <ports, events, projections, external calls>
- **Forbidden:** <imports or ownership leaks>
