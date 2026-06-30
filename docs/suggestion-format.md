# Suggestion Format Specification

The `review-technical-design` skill emits a structured list of suggestions in JSON format, which are then rendered into a human-readable `review-report.md`.

## JSON Schema Structure

Each suggestion conforms to the following schema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "ReviewSuggestion",
  "type": "object",
  "required": ["id", "title", "severity", "dimension", "finding", "proposed_fix", "rationale", "status"],
  "properties": {
    "id":          { "type": "string", "pattern": "^S-[0-9]{3}$", "description": "S-001, S-002, …" },
    "title":       { "type": "string", "description": "One-line summary" },
    "severity":    { "enum": ["blocking", "recommended", "optional"] },
    "dimension":   { "enum": ["altitude", "boundary", "use-case", "domain-model",
                              "consistency", "failure", "testability", "observability",
                              "enforceability", "over-engineering", "under-engineering"] },
    "location":    { "type": "string", "description": "Design section / use-case / file the finding applies to" },
    "finding":     { "type": "string", "description": "What is wrong or missing" },
    "proposed_fix":{ "type": "string", "description": "Concrete suggested change — not applied automatically" },
    "rationale":   { "type": "string", "description": "Why it matters" },
    "effort":      { "enum": ["S", "M", "L"], "description": "Optional rough cost of the fix" },
    "status":      { "enum": ["open", "accepted", "rejected", "deferred"], "default": "open" },
    "decision_ref":{ "type": "string", "pattern": "^D-[0-9]{3}$", "description": "Links to decisions.md once disposed" }
  }
}
```

## Disposition and Convergence
- Suggestions are born `open`.
- They change status *only* when the human user provides a disposition, which must be recorded in the decision log (`decisions.md`).
- A design review loop is only considered **settled** when zero `blocking` suggestions remain in the `open` state.
