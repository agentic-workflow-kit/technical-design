# Customer Credit Order Saga Brief

## Goal

Design an orchestration-based order-creation flow where an order is created first and then checked
against customer credit by a separate service.

## Source Facts

| ID        | Fact |
| --------- | ---- |
| `SRC-001` | The implementation example has two services: `Order Service` creates orders and `Customer Service` manages customers. |
| `SRC-002` | The order-creation saga creates an order in `PENDING`, then sends a `reserveCredit` command to `Customer Service`, and later approves or rejects the order. |
| `SRC-003` | The order model uses `PENDING`, `APPROVED`, and `REJECTED` states, and rejection reasons include `UNKNOWN_CUSTOMER` and `INSUFFICIENT_CREDIT`. |
| `SRC-004` | Customer logic owns customer records, credit limit, available-credit calculation, and per-order credit reservations, and it returns reserve-credit outcomes to the saga. |
| `SRC-005` | Each service persists its own data: `Customer Service` persists `Customer`; `Order Service` persists `Order` and `CreateOrderSaga`. |
| `SRC-006` | The saga pattern here is a sequence of local transactions. Each local transaction updates its database and publishes a message or event to trigger the next step. |
| `SRC-007` | In this framework, orchestration uses a centralized saga orchestrator with request/reply messaging, and the CDC service publishes persisted messages to Kafka. |
| `SRC-008` | For this case, shared database transactions, distributed transactions, and `2PC` contradict the source-backed saga approach. |

## Constraints

- Treat the orchestration-based Customers and Orders example as the implementation anchor.
- Do not mix in choreography-based or CQRS-specific behavior from other examples.
