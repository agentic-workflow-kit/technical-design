# CI Gate for Architecture Enforcement

Use this after `enforce-architecture` generates `.dependency-cruiser.js` from the settled design's
enforcement map.

## package.json script

```json
{
  "scripts": {
    "check:architecture": "depcruise --config .dependency-cruiser.js src"
  }
}
```

## Required seed proof

For every generated rule, keep a seeded violation fixture or local eval that proves the rule fails.
The enforcement closeout should record:

| Rule | Seed | Expected result | Gate |
|---|---|---|---|
| <no-domain-to-infrastructure> | <seed path> | fails with rule name | `npm run check:architecture` |

## GitHub Actions example

```yaml
name: Architecture Check
on: [push, pull_request]
jobs:
  enforce:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run check:architecture
```
