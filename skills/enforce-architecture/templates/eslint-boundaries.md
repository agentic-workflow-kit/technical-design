# ESLint Boundaries Enforcement

To complement dependency-cruiser, you can use ESLint's `no-restricted-imports` rule or `eslint-plugin-boundaries` to provide fast, in-editor feedback.

## no-restricted-imports example

Add this to your `.eslintrc.js` or `eslint.config.js`:

```javascript
module.exports = {
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['../infra/*', '../../infra/*'],
            message: 'Domain layer cannot import from infrastructure.',
          },
        ],
      },
    ],
  },
};
```
