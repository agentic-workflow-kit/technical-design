# Reference Design: Aerial Delivery Shipping

This reference is a comparison anchor, not an exact-output target or a certified great solution.

## Bounded Contexts

- Shipping owns the shipping-side domain model and the cross-context workflow needed to turn a pickup request into a tracked delivery.
- Drone Management owns drone availability and fleet scheduling facts. Shipping reads drone-facing information but does not own fleet policy.
- Accounts owns business enrollment and customer account records used by shipping.
- Package owns package identity and package tagging as a separate aggregate and direct microservice candidate.
- Delivery owns scheduled and in-progress delivery state plus delivery status transitions.
- Scheduler owns the scheduling workflow that coordinates account checks, package preparation, drone assignment, and delivery creation.
- Supervisor owns monitoring of scheduled steps so timeouts or failed steps can be detected without moving that concern into the aggregates.
- Ingestion owns request buffering and load leveling ahead of scheduling.
- Delivery History owns long-term completed-delivery history and analytics-oriented storage.

This is one acceptable decomposition. `Package`, `Scheduler`, and `Supervisor` may also be shown as
internal Shipping sub-boundaries when their source-backed ownership remains explicit. `Ingestion` is
an optional buffering pattern in this fixture, not a mandatory standalone context.

## Required Behavior

Businesses register with the service before shipping can accept pickup work for them. Users request
pickup of goods for delivery. Scheduler coordinates the workflow and assigns a drone using
Shipping-facing reads from Accounts, Drone Management, Package, and Delivery.

The system gives users an estimated delivery time when scheduling succeeds. While the drone is in
flight, Delivery exposes the current location and the latest ETA for that delivery. Shipping and
Drone Management are the core subdomains, so the design should keep them explicit instead of hiding
them inside a generic workflow service.

Delivery keeps the operational state for scheduled or in-progress deliveries. Delivery History is a
separate boundary that consumes delivery-tracking updates and stores completed-delivery history in
storage shaped for analytics and later lookup. The design should not collapse in-flight state and
historical reporting into one ownership boundary.

Detailed account internals, drone regulatory workflows, exact public APIs, and production flight-safety policies
remain out of scope for this fixture.
