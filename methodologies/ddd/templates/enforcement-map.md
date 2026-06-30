# Enforcement Map

The enforcement map is the design-owned input to `enforce-architecture`.

```json
{
  "layers": [
    { "name": "domain", "path": "src/domain" },
    { "name": "application", "path": "src/application" },
    { "name": "infrastructure", "path": "src/infrastructure" }
  ],
  "forbidden": [
    {
      "from": "domain",
      "to": "infrastructure",
      "reason": "Domain model must not import persistence or provider SDKs.",
      "seededViolation": "src/domain/__architecture__/domain-imports-infra.seed.ts"
    }
  ]
}
```

## Rules

- Every `forbidden` rule must cite `from`, `to`, `reason`, and `seededViolation`.
- The seed path must intentionally violate the rule in an eval or local architecture fixture.
- A rule without a seed is not production-ready because the gate could pass vacuously.
- Manual-only boundaries belong in the design review checklist, not the generated enforcement map.
