# Laundry Pickup Scheduling Brief

## Goal

Build a small scheduling service for a housing complex laundry room. Residents reserve shared laundry
appliances and receive lifecycle notifications.

## Source Facts

| ID        | Fact                                                                                                                                 |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `SRC-001` | Residents must be verified before they can create a booking.                                                                         |
| `SRC-002` | One appliance can have only one active booking for a time slot. Overlapping active bookings are not allowed.                         |
| `SRC-003` | A resident may hold at most one active booking at a time.                                                                            |
| `SRC-004` | Booking lifecycle states are `requested`, `confirmed`, `in_use`, `completed`, and `cancelled`.                                       |
| `SRC-005` | Residents may cancel a booking until 30 minutes before its start time.                                                               |
| `SRC-006` | Maintenance holds can block time windows for a specific appliance.                                                                   |
| `SRC-007` | The service sends notifications when a booking starts, is cancelled, or completes.                                                   |
| `SRC-008` | Public surfaces required for the first version are `POST /bookings`, `GET /appliances`, and `PATCH /bookings/{id}/cancel`.           |
| `SRC-009` | Domain events required for the first version are `BookingRequested`, `BookingConfirmed`, `BookingCancelled`, and `BookingCompleted`. |
| `SRC-010` | Billing, dynamic pricing, rewards, and external payment integration are out of scope.                                                |
| `SRC-011` | Appliance types are washer and dryer.                                                                                                |

## Constraints

- Maximum booking length is 90 minutes.
- The first design should prefer explicit context ownership over tactical DDD ceremony unless strict
  invariants require it.
