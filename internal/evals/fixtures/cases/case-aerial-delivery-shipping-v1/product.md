# Aerial Delivery Shipping Brief

## Goal

Design the shipping side of a drone-delivery platform where businesses enroll in the service,
customers request pickups, scheduling assigns drones, and users can track active deliveries.

## Source Facts

| ID        | Fact |
| --------- | ---- |
| `SRC-001` | The scenario is a drone-delivery service: businesses register, users request pickups, scheduling assigns a drone, and the user receives an estimated delivery time plus live tracking during the trip. |
| `SRC-002` | The domain includes scheduling drones, tracking packages, managing user accounts, and storing plus analyzing historical delivery data. Different parts of the system have different storage and query needs. |
| `SRC-003` | Shipping and drone management are core subdomains. User accounts are a generic subdomain and invoicing is a supporting subdomain. |
| `SRC-004` | Shipping depends on accounts for customer information and on drone management for fleet scheduling, but each bounded context keeps its own model. |
| `SRC-005` | In the shipping model, `Delivery`, `Package`, `Drone`, and `Account` are separate aggregates with independent life cycles, and aggregates reference one another by identity. |
| `SRC-006` | The shipping context introduces two domain services: `Scheduler` coordinates scheduling steps and `Supervisor` monitors those steps for failures or timeouts. |
| `SRC-007` | Shipping scenarios include package tagging, ETA calculation, in-flight location and ETA tracking, cancellation until pickup, completion notification, and completed-delivery history lookup. |
| `SRC-008` | Delivery, Package, Scheduler, and Supervisor are direct microservice candidates. Account and Drone can be reached directly or mediated through shipping-facing services. |
| `SRC-009` | An `Ingestion` microservice can absorb client traffic, place requests into a buffer, and let `Scheduler` consume from that buffer. |
| `SRC-010` | `Delivery History` is separated from `Delivery` because long-term history storage and analytics differ from real-time delivery operations. It listens for `DeliveryTracking` events. |
| `SRC-011` | The `Delivery` service keeps only scheduled or in-progress deliveries, favors high read/write throughput, and serves latest-status lookups instead of heavy analysis. |
| `SRC-012` | The `Delivery History` service stores long-term delivery data for analytics and post-completion lookups, which can require different storage strategies for bulk analysis versus per-delivery lookup. |
| `SRC-013` | Detailed account internals, drone regulatory workflows, exact public APIs, and production flight-safety policies are intentionally out of scope for this fixture. |

## Constraints

- Preserve explicit ownership boundaries instead of collapsing the whole flow into one service.
- Keep in-flight delivery state separate from long-term delivery history.
- Do not infer product scope that the sources do not specify.
