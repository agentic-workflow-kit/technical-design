# Grader Notes

This case is grounded in Microsoft Learn's drone-delivery example, but the fixture only grades the
paraphrased facts committed here. It should not reward answers merely for echoing Azure article
phrasing, and it should not penalize alternate bounded-context names when the same ownership split
is explicit.

The Supervisor boundary is intentionally narrow. The allowed sources establish monitoring for
failures or timeouts, but they do not justify a full recovery-policy design.

Do not add facts from `reference-design.md` unless the same fact already appears in `product.md` or
`source-map.md`.
