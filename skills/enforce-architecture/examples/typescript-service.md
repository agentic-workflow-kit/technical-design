# Example: TypeScript DDD Ports and Adapters Enforcement

For a TypeScript service with DDD depth `ports-and-adapters`:

- `src/api`
- `src/application`
- `src/domain`
- `src/infrastructure`

The settled design's enforcement map should include only the boundaries it actually owns, for example:

```json
{
  "layers": [
    { "name": "domain", "path": "src/domain" },
    { "name": "infrastructure", "path": "src/infrastructure" }
  ],
  "forbidden": [
    {
      "from": "domain",
      "to": "infrastructure",
      "reason": "Domain must depend on ports, not concrete persistence or provider SDKs.",
      "seededViolation": "src/domain/__architecture__/domain-imports-infrastructure.seed.ts"
    }
  ]
}
```

`enforce-architecture` generates `no-domain-to-infrastructure` and the CI gate is accepted only after
the seeded violation fails for that rule.
