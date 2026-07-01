# Reference Design: Customer Credit Order Saga

This reference is a comparison anchor, not an exact-output target or a certified great solution.

## Contexts

- Ordering owns order creation, order state, rejection reason, and saga orchestration.
- Customer Credit owns customer data, credit limit, credit reservations, and reserve-credit
  decisions.
- Messaging and Integration Infrastructure carries commands and asynchronous replies between
  services and publishes persisted messages through CDC to Kafka.

## Core Structure

Order Service and Customer Service are separate services. Order Service and Customer Service persist
their own data rather than sharing a database transaction.

Ordering starts order creation by creating an order in `PENDING`. Ordering then sends a
`reserveCredit` command to Customer Credit. Customer Credit decides whether credit can be reserved
for that order and replies with the outcome.

Ordering can finish in `APPROVED` or `REJECTED`. Rejection reasons include `UNKNOWN_CUSTOMER` and
`INSUFFICIENT_CREDIT`.

## Boundary Notes

Customer Credit is the authority for customer records, credit limit, available credit, and credit
reservation decisions. Ordering is the authority for order lifecycle state and rejection reason.
Messaging and Integration Infrastructure supports orchestration transport, but it does not own
customer data, order state, or business credit policy.

## Contradictions

Do not model this case with a shared database transaction, a distributed transaction, or `2PC`.
Those contradict the local-transaction saga approach used by the source-backed implementation.
