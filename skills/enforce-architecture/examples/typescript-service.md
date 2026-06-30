# Example: TypeScript Service Architecture Enforcement

For a TypeScript service with the following structure:
- `src/api`
- `src/application`
- `src/domain`
- `src/infrastructure`

The generated `dependency-cruiser.js` defines paths to match these directories and enforces the core invariant rules:
1. `no-domain-to-api`
2. `no-domain-to-app`
3. `no-domain-to-infra`
4. `no-infra-to-api`
5. `no-command-query-to-api`

When `npx depcruise src` is run, any cross-layer imports that violate these rules (such as `src/domain/model.ts` importing `src/infrastructure/db.ts`) will cause the build to fail, preventing the architecture from degrading.
