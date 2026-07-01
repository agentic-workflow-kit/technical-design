# technical-design

A self-contained set of AI skills for technical design: **resolve** required inputs, **agree** the
high-level system model, **plan** the design document structure, **author** a DDD-first design,
**review** it in a decision-recording loop, **enforce** its boundaries in CI, and **orchestrate** the
whole flow. It is fully functional as an independent tool/skills pack and is also shaped to slot seamlessly into the agentic-workflow-kit suite as the design stage.

The framework is **methodology-neutral** at its shell and **DDD-first** in v1. The active methodology
profile is `methodologies/ddd/`: every design uses strategic DDD vocabulary such as bounded
contexts, ubiquitous language, ownership, invariants, and context boundaries. Before choosing
`ddd_depth`, the flow selects an `architecture_mode` so system-entity, lifecycle, runtime,
ports/adapters, and contract/seam concerns can lead when they are the better first lens. Tactical DDD
artifacts such as aggregates, value objects, and domain events are added only when behavior and
invariants need them.

> **Status:** Built and ready for local use. The DDD-first production hardening is encoded in
> `methodologies/`, `docs/design/lessons-ledger.md`, the skill templates, and the eval fixtures.

## Documentation

- [`docs/product/`](docs/product/) - what this is, where it sits in the suite, and when to use it.
- [`docs/design/`](docs/design/) - methodology mechanics, profile contract, formats, and the
  lessons ledger.

Source lives in [`skills/`](skills/), [`methodologies/`](methodologies/),
[`evals/`](evals/), and [`scripts/`](scripts/).

---

## What it is

Strong models already hold generic architecture knowledge. This pack packages the discipline a model
does not reliably apply by itself:

1. **Source-grounded input resolution** - inspect source docs and current technical surfaces before
   asking.
2. **Human-approved system modeling** - expose entities, responsibilities, relations, ownership,
   seams, and lifecycle terms before durable design docs exist.
3. **Structure before authoring** - agree the docs tree and file responsibilities before writing the
   design.
4. **DDD-first modeling** - make boundaries, language, ownership, and invariants explicit at the
   right depth.
5. **Review as a loop** - suggestions you decide on, with every decision recorded.
6. **Executable boundaries** - CI gates that fail when the implemented dependency graph violates the
   agreed design.

## What it provides

```text
INPUTS -> SYSTEM MODEL -> STRUCTURE -> AUTHOR -> DIAGRAMS -> REVIEW <-> DECIDE -> ENFORCE
frame-technical-    frame-technical-    author-technical-   author-technical-  review-technical-
design              design              design              design             design
InputResolution     AgreedSystemModel   DocStructurePlan    DDD-first docs     three lenses
                                       approval gate       + delivery inputs  + suggestions

        orchestrate-technical-design (composition-only runbook)
```

- **`frame-technical-design`** - source map, `InputResolution`, `AgreedSystemModel`,
  `architecture_mode`, initial `ddd_depth`, blockers, and approval status.
- **`author-technical-design`** - requires an approved system model and `DocStructurePlan`, then
  produces a technical-solution-compatible design with DDD frontmatter, bounded contexts, language,
  invariants, ports/adapters, enforcement map, delivery inputs, and optional diagrams.
- **`review-technical-design`** - architecture/enforceability, domain-correctness, and
  agreement-integrity review lenses. It emits structured suggestions and never edits the design
  without a recorded disposition.
- **`enforce-architecture`** - translates the design's enforcement map into TS-first dependency
  rules and requires seeded violations so the gate cannot pass vacuously.
- **`orchestrate-technical-design`** - reads and applies the four skills in order, stopping at
  approval boundaries and never inventing methodology behavior.

## How to use

```text
# full design
Use frame-technical-design to resolve inputs and agree the system model, then author-technical-design
to agree structure and author docs, then review (loop), then enforce.
Context: <brief / PRD>, stack, scale, constraints.

# review an existing design
Use review-technical-design on <design>. Give me architecture/enforceability, domain-correctness,
and agreement-integrity suggestions; I will dispose, you record.

# hands-off
Use orchestrate-technical-design from <brief>; stop after <inputs | system-model | structure |
author | diagrams | review | enforce>.
```

## Development

This repo is a skills pack. The root package is private and exists to provide one contributor and CI
gate; it does not publish the skills.

```bash
pnpm install --frozen-lockfile
pnpm check
```

`pnpm check` runs formatting validation plus the eval package's deterministic checks:
skill/profile static checks, Vitest fixture tests, and the seeded `enforce-architecture`
dependency-cruiser evals. Manual or model-graded evals use the root `pnpm eval:*` commands backed
by `@agentic-workflow-kit/eval-kit`.

## Methodology model

The five skills are stable. Methodology-specific behavior lives under `methodologies/`.

The v1 profile is `methodologies/ddd/`. A future profile, for example event-sourced DDD or another
architecture method, must supply the same contract: templates, review rubric, enforcement map,
examples, and eval expectations. Event sourcing is intentionally not the v1 replacement methodology;
it is a future profile or subprofile when audit, replay, or temporal-query needs justify it.

## What this deliberately is not

- Not a DDD base-class framework.
- Not a framework-specific folder template.
- Not an implementation executor.
- Not dependent on prior application repositories or private app-specific case studies.

Designs should be human-readable first, checkable second, and enforceable where the design declares a
boundary worth protecting.
