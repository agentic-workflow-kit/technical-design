# Evaluation and Acceptance

This directory contains fixtures and tests to ensure the `technical-design` pack functions according to its Key Results.

## Structure

- `frame/`: Fixtures mapping a brief to expected clarifying questions and complexity flags.
- `author/`: Fixtures mapping a problem frame to expected design properties (especially ensuring the correct altitude is selected).
- `review/`: Fixtures mapping a drafted design to expected suggestions (including catching over/under-engineering).
- `enforce/`: Contains a dummy project structure to verify that the generated CI configuration actively fails when a seeded boundary violation is introduced.

## The Verifiable Requirement

The `enforce` evaluation is the most critical programmatic check in this pack. 
To pass:
1. Generate the `dependency-cruiser.js` configuration.
2. Run `npx depcruise src` within `evals/enforce`.
3. The build **must fail** with a boundary violation (specifically, `no-domain-to-infra`) because the seeded `src/domain/index.ts` file intentionally imports from `src/infra/database.ts`.
