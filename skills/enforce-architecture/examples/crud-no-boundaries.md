# Example: Strategic-only DDD with no enforceable import boundary

Shows the honest decline path: a design can be DDD-first at the strategic level while still having no
static import boundary worth enforcing.

**User:**
"Here is our settled design for profile settings. It is `ddd_depth: strategic-only`, uses the existing
framework structure, and declares no folder-level separation. Please enforce the boundaries."

**Agent (`enforce-architecture`):**

**DDD depth:** strategic-only

**Boundaries declared:** none

Extracting the layer map:

```json
{ "layers": [], "forbidden": [] }
```

Running the generator:

```bash
node scripts/generate_depcruise.mjs layer-map.json --output .dependency-cruiser.js
```

**Output:**

```text
Notice: No enforceable architectural boundaries declared. Generating a minimal config for an honest pass.
Wrote minimal config to .dependency-cruiser.js
```

**Conclusion:**

There are no static import boundaries to enforce. The design remains DDD-first through ownership,
language, and invariant clarity, but this skill does not invent `domain -> infrastructure` rules
against folders that do not exist.
