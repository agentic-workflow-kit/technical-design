# Example: Simple CRUD (rung 1) — nothing to enforce (anti-vacuous)

Shows the honest decline path: at an altitude with no architectural separation, the
skill must NOT emit rules against folders that don't exist (which would make the CI gate
pass vacuously). It says so plainly instead.

**User:**
"Here is our settled design for the User Profile service. It's a simple CRUD app over a
`users` table — standard framework controllers and models, no layered separation. Please
enforce the boundaries."

**Agent (`enforce-architecture`):**

**Altitude:** Simple CRUD (rung 1)
**Boundaries declared:** none — at this altitude there is no domain/persistence separation.

Extracting the layer map:
```json
{ "layers": [], "forbidden": [] }
```

Running the generator:
```bash
node scripts/generate_depcruise.mjs layer-map.json --output .dependency-cruiser.js
```

**Output:**
> Notice: No architectural boundaries to enforce at this altitude. Generating empty/vacuous guard config.
> Wrote minimal config to .dependency-cruiser.js

**Conclusion:**
There are no architectural boundaries to enforce at this altitude, so I did **not** invent
`no-domain-to-infra`-style rules against folders that don't exist — that would be a vacuous
gate that passes while checking nothing. If you want, `dependency-cruiser` can still be used
to detect circular dependencies with the minimal config. Climb to a layered or hexagonal
altitude only when complexity earns it, and re-run this skill.
