# CI Gate for Architecture Enforcement

To ensure architectural boundaries are strictly enforced in Continuous Integration, add the following to your CI pipeline or `package.json` scripts:

## package.json script

```json
{
  "scripts": {
    "check:architecture": "npx depcruise src"
  }
}
```

## GitHub Actions example

```yaml
name: Architecture Check
on: [push, pull_request]
jobs:
  enforce:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run check:architecture
```
