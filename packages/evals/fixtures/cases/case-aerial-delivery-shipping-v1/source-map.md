# Source Map

| ID        | Category | Reference URL | Establishes |
| --------- | -------- | ------------- | ----------- |
| `SRC-001` | scenario | `https://learn.microsoft.com/en-us/azure/architecture/microservices/model/domain-analysis` | Businesses enroll, users request pickup, the system assigns a drone, and active deliveries expose ETA plus location tracking. |
| `SRC-002` | scenario | `https://learn.microsoft.com/en-us/azure/architecture/microservices/model/domain-analysis` | Scheduling, package tracking, accounts, and historical analysis are distinct concerns, and the system has mixed storage/query requirements. |
| `SRC-003` | strategic-ddd | `https://learn.microsoft.com/en-us/azure/architecture/microservices/model/domain-analysis` | Shipping and drone management are the core subdomains that deserve the most modeling effort. |
| `SRC-004` | strategic-ddd | `https://learn.microsoft.com/en-us/azure/architecture/microservices/model/domain-analysis` | Shipping interacts with accounts and drone management but bounded contexts retain separate models and responsibilities. |
| `SRC-005` | tactical-ddd | `https://learn.microsoft.com/en-us/azure/architecture/microservices/model/tactical-domain-driven-design` | Delivery, Package, Drone, and Account are separate aggregates with identity-based cross-references. |
| `SRC-006` | tactical-ddd | `https://learn.microsoft.com/en-us/azure/architecture/microservices/model/tactical-domain-driven-design` | Scheduler coordinates shipping steps and Supervisor watches those steps for failures or timeouts. |
| `SRC-007` | tactical-ddd | `https://learn.microsoft.com/en-us/azure/architecture/microservices/model/tactical-domain-driven-design` | Shipping scenarios include ETA, tracking, cancellation until pickup, notifications, and delivery-history lookup. |
| `SRC-008` | microservice-boundaries | `https://learn.microsoft.com/en-us/azure/architecture/microservices/model/microservice-boundaries` | Delivery, Package, Scheduler, and Supervisor are valid service candidates, while Account and Drone can be mediated for shipping needs. |
| `SRC-009` | microservice-boundaries | `https://learn.microsoft.com/en-us/azure/architecture/microservices/model/microservice-boundaries` | Ingestion handles request buffering and load leveling before Scheduler executes the workflow. |
| `SRC-010` | microservice-boundaries | `https://learn.microsoft.com/en-us/azure/architecture/microservices/model/microservice-boundaries` | Delivery History is split from Delivery and consumes DeliveryTracking events for long-term storage. |
| `SRC-011` | data-considerations | `https://learn.microsoft.com/en-us/azure/architecture/microservices/design/data-considerations` | Delivery storage is optimized for scheduled or in-progress state and fast status reads, not historical analysis. |
| `SRC-012` | data-considerations | `https://learn.microsoft.com/en-us/azure/architecture/microservices/design/data-considerations` | Delivery History needs separate long-term analytical storage and a faster lookup path for completed deliveries. |
| `SRC-013` | fixture-scope | `product.md#source-facts` | Detailed account internals, drone regulatory workflows, exact public APIs, and production flight-safety policies stay out of scope. |
