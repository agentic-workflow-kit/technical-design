# Example: Layered (rung 2) — a NON-hexagonal boundary

Shows that enforcement is driven by the design's *declared* layers, not a fixed
domain/infra taxonomy. Here the design is a layered service whose only boundary is
"the model must not depend on the controller."

**User:**
"Here is our settled design for the Orders service. It's a layered app: `model` holds
data + rules, `controller` handles HTTP. The model must never import the controller.
Please enforce it."

**Agent (`enforce-architecture`):**

**Altitude:** Layered (rung 2)
**Boundaries declared:** `model ↛ controller`

Extracting the layer map:
```json
{
  "layers": [
    { "name": "model", "path": "src/model" },
    { "name": "controller", "path": "src/controller" }
  ],
  "forbidden": [ { "from": "model", "to": "controller" } ]
}
```

Running the generator:
```bash
node scripts/generate_depcruise.mjs layer-map.json --output .dependency-cruiser.js
```

**Output:** a real, non-hexagonal rule — `no-model-to-controller` — not a canned
domain/infra rule:
```js
forbidden: [
  {
    name: 'no-model-to-controller',
    comment: 'This design explicitly forbids model from depending on controller',
    severity: 'error',
    from: { path: 'src/model' },
    to:   { path: 'src/controller' },
  },
]
```

The CI gate now fails if `src/model/*` ever imports `src/controller/*`. The same skill
would produce `no-presentation-to-data`, `no-feature-a-to-feature-b`, etc. — whatever
the design's layers are called. See `examples/typescript-service.md` for the hexagonal
case and `examples/crud-no-boundaries.md` for when there is nothing to enforce.
