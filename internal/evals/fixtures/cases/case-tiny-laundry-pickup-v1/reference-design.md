# Reference Design: Laundry Pickup Scheduling

This reference is a comparison anchor, not an exact-output target.

## Bounded Contexts

- Identity owns verified resident records and access checks.
- Catalog owns appliance metadata, appliance type, and maintenance hold inputs.
- Scheduling owns booking lifecycle, overlap detection, active-booking limits, and cancellation rules.
- Notifications owns outbound lifecycle messages.

## Required Behavior

Booking lifecycle states are `requested`, `confirmed`, `in_use`, `completed`, and `cancelled`.
Scheduling rejects overlapping active bookings for the same appliance and rejects a second active
booking for the same resident, preserving one active booking per resident. A resident can cancel until
30 minutes before start. Maintenance holds block booking creation for the affected appliance and time
window.

Billing, pricing, rewards, and payment integration remain out of scope.

## Public Surfaces

- `POST /bookings`
- `GET /appliances`
- `PATCH /bookings/{id}/cancel`

## Events

- `BookingRequested`
- `BookingConfirmed`
- `BookingCancelled`
- `BookingCompleted`
