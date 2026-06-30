# Grader Notes

This case is anchored to the orchestration-based Eventuate Tram Customers and Orders example. Grade
only explicit evidence that preserves the source-backed responsibilities, flow, outcomes, and
contradictions.

Do not treat the reference design as the only valid decomposition. It is a comparison anchor only.

Do not accept choreography-based event exchange, CQRS-specific read models, or shared-database
transaction assumptions unless the candidate clearly marks them as out of scope or contradictions.

Do not add facts from `reference-design.md` unless they are already grounded in `product.md` or
`source-map.md`.
