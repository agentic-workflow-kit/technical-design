# Promptfoo Codex Eval Pilot

## Goal

Build a small, repeatable eval pilot that proves `technical-design` can run an actual design task,
grade the generated design, judge it semantically, and produce a readable final report.

The pilot starts with one case: `case-tiny-laundry-pickup-v1`.

## What We Need

The pilot needs one end-to-end eval flow:

1. Generate a candidate technical design from the case brief.
2. Run deterministic grading against expected facts and boundaries.
3. Run a pointwise model-graded coverage judge against expected facts and boundaries when manual
   calibration evidence is needed.
4. Run a pairwise semantic judge comparing the candidate to the case reference anchor.
5. Validate judge outputs against repo JSON schemas.
6. Produce a final report with commands, provenance, verdicts, token and runtime metadata, and caveats.

The model calls must use local Codex authentication. The pilot must not require `OPENAI_API_KEY`.

## Why

The repo already has deterministic fixtures, schemas, a tiny product-to-design case, a deterministic
case runner, and manual judge scaffolding. It does not yet prove the full workflow: given a product
brief, can the pack produce a usable technical design, and can the repo evaluate that output?

This pilot creates the first real loop before expanding the case portfolio. It should validate the
case format, Promptfoo suite shape, Codex provider configuration, deterministic grader integration,
judge rubric, result bundle convention, and final reporting story.

## Design Principles

- Promptfoo owns the model-eval suite: prompts, providers, test variables, assertions, and exported
  result formats.
- Codex owns local model execution through its app-server provider and existing local auth.
- Eval logic lives in a private internal package, not beside the product skills and methodology
  artifacts.
- Deterministic graders stay authoritative for facts, boundaries, schemas, and generated-result
  structure.
- The LLM judge is advisory until human calibration demonstrates acceptable false-pass and
  false-fail behavior.
- The reference design is a comparison anchor, not a certified great solution or exact-output target.
- Model-graded commands remain manual and outside `pnpm check`.

## Tooling Decision

Use Promptfoo with its documented OpenAI Codex App Server provider, not a shell workaround around
Promptfoo.

Promptfoo's OpenAI provider docs describe Codex App Server as an agentic provider. The Codex App
Server provider manages a local child process of `codex app-server`, supports final assistant text,
input items, JSON schema output, token usage and estimated cost, thread and turn IDs, approval and
tool metadata, and deep tracing. It does not attach to an existing Codex Desktop process.

Promptfoo also supports first-class suite outputs in JSON, HTML, and JUnit formats, and test cases
with `vars` and assertions such as `is-json`. The pilot should use those surfaces instead of hiding
model execution behind a custom runner.

References:

- Promptfoo OpenAI providers: https://www.promptfoo.dev/docs/providers/openai/#agentic-providers
- Promptfoo Codex App Server provider: https://www.promptfoo.dev/docs/providers/openai-codex-app-server/
- Promptfoo test cases: https://www.promptfoo.dev/docs/configuration/test-cases/
- Promptfoo assertions: https://www.promptfoo.dev/docs/configuration/expected-outputs/
- Promptfoo outputs: https://www.promptfoo.dev/docs/configuration/outputs/
- Codex authentication: https://developers.openai.com/codex/auth
- Codex non-interactive and local auth behavior: https://developers.openai.com/codex/noninteractive

## How

Use Promptfoo as the outer eval runner and the Codex App Server provider as the model execution
provider.

The implementation should create Promptfoo suites, not bespoke shell wrappers:

1. A generation suite asks Codex to produce a candidate technical design from the laundry case brief
   and the repo's `author-technical-design` expectations.
2. The existing deterministic case runner grades that generated candidate against expected facts and
   boundaries.
3. A pointwise judge suite asks Codex to inspect each expected fact and boundary against candidate
   evidence without using the reference design.
4. A pairwise judge suite asks Codex to compare the generated candidate with the existing reference
   anchor and return schema-constrained JSON.
5. A report command collects the Promptfoo outputs, deterministic grades, judge JSON, provenance, and
   caveats into one final local report.

This keeps the value of Promptfoo intact:

- Promptfoo owns providers, test variables, assertions, repeatable suite files, and output exports.
- The Codex App Server provider owns model execution through `codex app-server`, local Codex auth,
  Codex metadata, and token/runtime reporting.
- Repo scripts only prepare run-local fixtures, call Promptfoo with concrete configs, validate
  generated artifacts with existing schemas, and write reports under `internal/evals/results/**`.

This design follows the docs for these reasons:

- Promptfoo's OpenAI provider docs list Codex App Server as an agentic provider, so Codex should be
  configured as a Promptfoo provider instead of hidden behind an `exec` workaround.
- The Codex App Server provider docs say it manages a local child process of `codex app-server` and
  captures final output, JSON schema output, token usage, thread and turn ids, tool metadata, and
  tracing. Those are exactly the provenance fields the pilot needs.
- Promptfoo test-case docs define `vars` and per-test assertions, which match the case inputs:
  product facts, expected facts, expected boundaries, candidate order, and randomization seed.
- Promptfoo assertion docs include JSON validation patterns, which match the judge requirement to
  return `pairwise-result.schema.json`-compatible output.
- Promptfoo output docs support JSON and HTML exports, which lets the pilot produce both
  machine-readable evidence and a human-readable report without inventing a separate report format
  for raw model output.
- Codex auth docs say local Codex can sign in with ChatGPT and cache credentials locally. The pilot
  should use that local Codex auth surface and never require or expose `OPENAI_API_KEY`.

## Internal Package Boundary

Create one private workspace package for all eval-specific assets and logic:

```text
internal/evals/
  package.json
  README.md
  implementation-plan.md
  src/
  tests/
  schemas/
  fixtures/
  promptfoo/
  results/
```

Package name:

```text
@agentic-workflow-kit/technical-design-evals
```

This package is internal infrastructure for the `technical-design` repo. It must stay private and
must not be treated as part of the product surface shipped to users. It is also the direct command
surface for eval work; do not add root scripts for manual or model-graded eval commands.

Move all eval-specific material into the package:

- `evals/README.md` and `evals/implementation-plan.md` -> package docs.
- `evals/run_case_eval.mjs`, `evals/validate_eval_fixtures.mjs`, and future runner scripts ->
  `internal/evals/src/`.
- `evals/tests/**` -> `internal/evals/tests/`.
- `evals/schemas/**` -> `internal/evals/schemas/`.
- `evals/cases/**`, `evals/review/**`, `evals/ddd/**`, `evals/frame/**`, `evals/author/**`, and
  `evals/planning/**` -> `internal/evals/fixtures/`.
- `evals/judges/**` -> `internal/evals/promptfoo/judges/`.
- `evals/outcomes/**` -> `internal/evals/fixtures/outcomes/`.
- `evals/results/**` -> `internal/evals/results/**`.
- `evals/enforce/**` -> `internal/evals/fixtures/enforce/**`; remove the nested enforce workspace
  package and let the internal eval package own `dependency-cruiser`.

Root-level docs may still describe the evaluation strategy, because that strategy is part of how the
product is designed and governed. Executable eval assets, fixture data, generated outputs, schemas,
and eval-specific implementation docs belong in the internal package.

The root package should stay small. It may keep `check` as the public deterministic repo gate, but
manual eval commands should be run directly against the internal package:

```text
pnpm --filter @agentic-workflow-kit/technical-design-evals eval:case -- <args>
pnpm --filter @agentic-workflow-kit/technical-design-evals eval:generate -- <args>
pnpm --filter @agentic-workflow-kit/technical-design-evals eval:judge -- <args>
pnpm --filter @agentic-workflow-kit/technical-design-evals eval:outcome -- <args>
pnpm --filter @agentic-workflow-kit/technical-design-evals eval:manual-report -- <args>
```

The root `pnpm check` command remains the public repository gate. It should run formatting and the
internal eval package's deterministic check, but it should not expose every eval workflow as a root
script.

## Planned Suite Shape

Add `promptfoo` as a development dependency of the internal eval package and add manual scripts:

- `eval:generate` - run the candidate-generation Promptfoo suite.
- `eval:judge:coverage` - run the pointwise coverage judge Promptfoo suite.
- `eval:judge` - run the pairwise judge Promptfoo suite.
- `eval:outcome` - validate and report a redacted outcome-study summary.
- `eval:manual-report` - combine generation, deterministic, judge, and outcome results into one
  final report.

Keep `pnpm check` deterministic-only.

The suites should live under `internal/evals/promptfoo/`:

- Generation suite:
  - Provider: `openai:codex-app-server`.
  - Model: `gpt-5.4`.
  - Reasoning effort: medium.
  - Working directory: repo root.
  - Sandbox: read-only.
  - Approval policy: never.
  - Auth: local Codex auth via `CODEX_HOME`.
  - Test variables: case id, product brief, source map, expected design contract, and relevant skill
    instructions.
  - Assertions: non-empty output, required design markers, expected source IDs, no obvious billing
    scope invention, and Promptfoo provider success.

- Judge suite:
  - Provider: `openai:codex-app-server`.
  - Model: `gpt-5.4`.
  - Reasoning effort: medium.
  - Output schema: `internal/evals/schemas/pairwise-result.schema.json`.
  - Test variables: case id, source facts, expected facts and boundaries, generated candidate,
    reference anchor, candidate order, original order, randomization method, and seed.
  - Assertions: JSON output, schema-valid output, evidence present, model/provider/rubric/prompt
    metadata present, and randomization proof present.

- Pointwise coverage judge suite:
  - Provider: `openai:codex-app-server`.
  - Model: `gpt-5.4`.
  - Reasoning effort: medium.
  - Output schema: `internal/evals/schemas/pointwise-judge-result.schema.json`.
  - Test variables: case id, source facts, expected facts and boundaries, generated candidate, and
    deterministic grades if available.
  - Assertions: JSON output, schema-valid output, evidence on every covered/partial/contradicted
    item, and no dependency on `reference-design.md`.

## Result Flow

Generated outputs stay under ignored `internal/evals/results/<run-id>/`.

The generation command writes:

- Promptfoo JSON output.
- Promptfoo HTML output.
- `cases/case-tiny-laundry-pickup-v1/candidate.md`.
- `manifest.json` with git commit, command, run type, model, provider, Codex auth mode, tool
  versions, case ids, and output files.
- `report.md` with blocker-first generation status.

The deterministic command then runs the existing case grader against the generated candidate.

The judge command writes:

- Promptfoo JSON output.
- Promptfoo HTML output.
- validated pairwise result JSON.
- `manifest.json` with model/provider/rubric/prompt/randomization metadata.
- `report.md` with the judge verdict and caveats.

The final report command combines all run bundles and states:

- whether generation succeeded;
- whether deterministic grading passed;
- whether judge JSON was schema-valid;
- which candidate won the pairwise comparison, if any;
- what token/runtime metadata Promptfoo and Codex reported;
- why the result is not yet a release signal without human calibration.

## Acceptance Criteria

- `pnpm check` remains green and deterministic-only.
- The pilot does not require or document `OPENAI_API_KEY`.
- `codex login status` is checked before model-graded runs.
- Promptfoo, not shell wrappers, owns provider execution, assertions, and JSON/HTML result exports.
- Candidate generation produces a non-empty Markdown design for `case-tiny-laundry-pickup-v1`.
- The existing deterministic grader runs against the generated candidate.
- The judge output validates against `internal/evals/schemas/pairwise-result.schema.json`.
- The final report is written under ignored `internal/evals/results/**`.
- Generated result files are not committed unless a human reviewer explicitly promotes a redacted
  summary.

## Risks And Open Checks

- Promptfoo documents the Codex App Server provider as an agentic provider with rich metadata, but it
  also documents that it does not attach to an existing Desktop app process. The runner must expect
  Promptfoo to manage its own app-server child process.
- Codex local auth is a local credential surface. The implementation must never read, print, copy, or
  commit `~/.codex/auth.json`.
- Promptfoo and Codex provider versions may change. The final report must record tool versions and
  provider metadata so future runs can explain differences.
- The reference design is not a golden solution. Pairwise judging is comparison evidence only.
