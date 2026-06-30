# ESLint Boundary Guidance

Use ESLint for fast local/editor feedback when the design's folder layout makes static import
patterns reliable. Keep dependency-cruiser as the CI source of truth unless the repo already has a
stronger boundary plugin.

## no-restricted-imports example

```javascript
module.exports = {
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['../infrastructure/*', '../../infrastructure/*'],
            message: 'Domain code cannot import concrete infrastructure. Use a port owned by the domain/application boundary.',
          },
        ],
      },
    ],
  },
};
```

## Rules

- Do not add ESLint patterns that do not correspond to a design-owned boundary.
- Do not claim ESLint proves domain correctness; it only helps enforce import direction.
- Keep seeded violation evidence for every CI-enforced rule.
