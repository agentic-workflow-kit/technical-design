# Eval Kit

Portable eval runner primitives for local eval suites.

`@agentic-workflow-kit/eval-kit` is a private workspace package. It owns reusable mechanics only:

- CLI argument helpers;
- safe path and ID resolution;
- JSON Schema registry and validation;
- result manifest and artifact records;
- Promptfoo raw execution/output parsing helpers;
- generic verdict aggregation.

It must not import `packages/evals`, `skills`, `methodologies`, `docs/design`, or suite fixtures.
Suite-specific semantics belong in the consuming package.

## Contracts

Portable schemas live in `schemas/`:

- `eval-kit.config.schema.json`
- `case-manifest.schema.json`
- `artifact.schema.json`
- `result-manifest.v2.schema.json`
- `finding.schema.json`
- `run-report.schema.json`

Result manifests use `artifacts[]` as the typed output contract. `output_files` remains available
for legacy compatibility and should mirror the files old consumers expect to find.

New artifacts receive a SHA-256 hash after write. Legacy manifests normalized from older
`output_files`-only bundles may use `sha256: null` with `redaction_status: "legacy-unknown"`.

## Extension Points

Suites provide their own adapters for:

- case discovery and fixture interpretation;
- deterministic graders;
- report rendering;
- prompt construction;
- domain-specific schemas and validation.

Provider adapters only invoke and collect raw evidence. They do not judge or grade.
