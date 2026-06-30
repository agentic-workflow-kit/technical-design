# Example: Declared non-hexagonal boundary

Shows that enforcement is driven by the design's declared map, not a fixed domain/infrastructure
taxonomy.

**User:**
"Here is our settled design. It has `model` and `controller` folders, and the model must never import
the controller. Please enforce it."

**Agent (`enforce-architecture`):**

**DDD depth:** strategic-only

**Boundary declared:** model must not import controller

Extracting the layer map:

```json
{
  "layers": [
    { "name": "model", "path": "src/model" },
    { "name": "controller", "path": "src/controller" }
  ],
  "forbidden": [
    {
      "from": "model",
      "to": "controller",
      "reason": "Model code must not import delivery/controller code.",
      "seededViolation": "src/model/index.ts imports src/controller/handler.ts"
    }
  ]
}
```

Running the generator:

```bash
node scripts/generate_depcruise.mjs layer-map.json --output .dependency-cruiser.js
```

**Output:** a real rule named `no-model-to-controller`. The CI gate must be run against the seeded
violation and fail for that rule before the boundary is considered production-ready.
