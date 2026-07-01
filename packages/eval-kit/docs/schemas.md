# Eval Kit Schemas

Bundled schemas live in `packages/eval-kit/schemas/`. They are registered automatically by
`loadConfig`, then any optional consumer `schema_roots` are added.

The schema registry is strict:

- duplicate `$id` values fail config loading;
- schemas can be validated by file name, such as `grades.schema.json`;
- schemas can be validated by `$id`;
- validation errors include the instance path and message.

## Portable Schemas

These are the core generic contracts.

### `eval-kit.config.schema.json`

Validates the suite config.

Required fields:

- `schema_version`: must be `eval-kit.config.v1`;
- `suite_id`: stable suite id used in runner ids;
- `suite_root`: path to suite files, relative to config file;
- `results_root`: path for run outputs, relative to config file.

Optional fields:

- `adapter`: suite adapter module path, relative to `suite_root`;
- `cases.root`: case directory root, relative to `suite_root`;
- `cases.include`: immediate case directory patterns to include;
- `cases.exclude`: immediate case directory patterns to exclude;
- `methods`: deterministic, generation, judge, and report method settings;
- `prompt_templates`: generation, pointwise, and pairwise prompt overrides;
- `schema_roots`: extra schema directories, relative to config file.

Legacy compatibility fields remain accepted:

- `case_manifests`: explicit manifest paths, relative to `suite_root`;
- `artifact_roles`: suite-defined role names;
- `runner_defaults`: runner-specific defaults;
- `graders`: map of grader name to module path;
- `reporters`: map of reporter name to module path;
- `hooks`: module path for generation, judge, report, and validation hooks.

### `case-manifest.schema.json`

Validates manifest-level structure.

Required fields:

- `schema_version`
- `case_id`
- `artifacts`

Each artifact requires:

- `role`
- `path`

The schema allows additional manifest fields so consumers can add grading, grounding, provenance,
or case taxonomy metadata.

### `artifact.schema.json`

Validates result artifact records.

Required fields:

- `role`
- `path`
- `sha256`
- `size_bytes`
- `media_type`
- `redaction_status`

Allowed `redaction_status` values:

- `raw-local`
- `redacted`
- `public-safe`
- `legacy-unknown`

### `result-manifest.v2.schema.json`

The current result bundle manifest.

Required fields:

- `schema_version`: must be `eval-kit.result-manifest.v2`;
- `run_id`;
- `run_type`;
- `runner.id` and `runner.version`;
- `case_ids`;
- `started_at`;
- `ended_at`;
- `duration_ms`;
- `status`: `completed` or `runner_failed`;
- `git.commit`;
- `command`;
- `tool_versions`;
- `artifacts`;
- `output_files`.

Optional model-run fields:

- `model`
- `provider`
- `model_provider`
- `reasoning_effort`
- `sandbox_mode`
- `approval_policy`
- `codex_auth_mode`
- `prompt_version`
- `rubric_version`
- `randomization`
- `provenance.parent_run_ids`

### `finding.schema.json`

Generic minimal finding shape:

- `id`
- `severity`
- `verdict`
- `evidence`

Additional properties are allowed.

### `run-report.schema.json`

Small summary contract:

- `run_id`
- `status`
- `summary`

## Current Consumer-Shaped Schemas

These schemas live in eval-kit today because they were part of the extraction from
`technical-design`. They should be reviewed before publishing eval-kit as a fully generic shared
package.

### `grades.schema.json`

Current deterministic result shape:

- `case_id`
- `verdict`: `red`, `yellow`, `green`, or `great`;
- `findings[]`.

Each finding currently requires:

- `id`
- `kind`: `fact` or `boundary`;
- `severity`: `critical` or `recommended`;
- `verdict`: `covered`, `missing`, `contradicted`, `invented`, or `unknown`;
- `evidence`.

### `expected-facts.schema.json`

Technical-design expected fact fixture shape. It supports:

- required source refs;
- critical or recommended severity;
- include-any and include-all text expectations;
- forbidden snippets;
- accepted alternatives;
- required concept groups.

### `expected-boundaries.schema.json`

Technical-design expected boundary fixture shape. It supports:

- context ids and names;
- owned, read, and not-owned responsibilities;
- required and forbidden snippets;
- accepted alternatives;
- required concept groups.

### `pointwise-judge-result.schema.json`

Pointwise model-judge result. The judge returns one item per expected fact or boundary:

- `item_id`
- `kind`
- `verdict`: `covered`, `partial`, `missing`, `contradicted`, or `unknown`;
- `severity`
- `confidence`
- `candidate_evidence`
- `source_refs`
- `explanation`

When the verdict is `covered`, `partial`, or `contradicted`, candidate evidence must be non-empty.

### `judge-output.schema.json`

Legacy single-criterion judge output shape retained for compatibility. It requires:

- `case_id`
- `criterion`
- `verdict`: `pass`, `fail`, or `unknown`;
- `severity`
- `evidence`
- `explanation`
- `confidence`
- `model`
- `rubric_version`

### `pairwise-result.schema.json`

Pairwise judge output and stored result schema. It requires:

- `case_id`
- `model`
- `provider`
- `rubric_version`
- `prompt_version`
- `candidate_order`
- `randomization`
- `winner`
- `criteria`
- `evidence`
- `explanation`
- `confidence`

### `results-manifest.schema.json`

Legacy manifest schema retained for compatibility. New output should use
`result-manifest.v2.schema.json`.

## Schema Registry API

```js
import { createSchemaRegistry } from "@agentic-workflow-kit/eval-kit";

const registry = createSchemaRegistry({
  schemaRoots: ["packages/eval-kit/schemas", "evals/schemas"],
});

const manifest = registry.validateWithSchema(
  "result-manifest.v2.schema.json",
  data,
  "result manifest",
);
```

The registry returns the input data when valid and throws on validation failure.
