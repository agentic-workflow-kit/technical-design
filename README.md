# technical-design

A self-contained set of AI skills for technical design: **frame** the problem, **author** a
DDD-first design, **review** it in a decision-recording loop, **enforce** its boundaries in CI, and
**orchestrate** the whole flow. It stands alone today and is shaped so it can later slot into a
larger agentic workflow suite as the design stage.

The framework is **methodology-neutral** at its shell and **DDD-first** in v1. The active methodology
profile is `methodologies/ddd/`: every design uses strategic DDD vocabulary such as bounded
contexts, ubiquitous language, ownership, invariants, and context boundaries. Tactical DDD artifacts
such as aggregates, value objects, and domain events are added only when behavior and invariants need
them.

> **Status:** Built and ready for local use. The DDD-first production hardening is encoded in
> `methodologies/`, `docs/design/lessons-ledger.md`, the skill templates, and the eval fixtures.

---

## What it is

Strong models already hold generic architecture knowledge. This pack packages the discipline a model
does not reliably apply by itself:

1. **Source-grounded framing** - inspect source docs and current technical surfaces before asking.
2. **DDD-first modeling** - make boundaries, language, ownership, and invariants explicit.
3. **Ceremony-right-sized depth** - strategic DDD always; tactical DDD only where useful.
4. **Review as a loop** - suggestions you decide on, with every decision recorded.
5. **Executable boundaries** - CI gates that fail when the implemented dependency graph violates the
   agreed design.

## What it provides

```text
FRAME -> AUTHOR -> REVIEW <-> DECIDE -> ENFORCE
frame-technical-    author-technical-   review-technical-   user disposes      enforce-
design              design              design              + record           architecture
source map +        DDD-first design    two review lenses   decisions.md       boundaries -> CI
blockers            + delivery inputs   + suggestions

        orchestrate-technical-design (composition-only runbook)
```

- **`frame-technical-design`** - source map, safe assumptions, blockers, DDD context candidates,
  complexity drivers, and initial DDD depth.
- **`author-technical-design`** - technical-solution-compatible design with DDD frontmatter,
  bounded contexts, language, invariants, commands/use cases, ports/adapters, consistency, failure
  modes, enforcement map, and delivery inputs.
- **`review-technical-design`** - architecture/enforceability and domain-correctness review lenses.
  It emits structured suggestions and never edits the design without a recorded disposition.
- **`enforce-architecture`** - translates the design's enforcement map into TS-first dependency
  rules and requires seeded violations so the gate cannot pass vacuously.
- **`orchestrate-technical-design`** - reads and applies the four skills in order, stopping where the
  user asks and never inventing methodology behavior.

## How to use

```text
# full design
Use frame-technical-design, then author-technical-design, then review (loop), then enforce.
Context: <brief / PRD>, stack, scale, constraints.

# review an existing design
Use review-technical-design on <design>. Give me architecture/enforceability and domain-correctness
suggestions; I will dispose, you record.

# hands-off
Use orchestrate-technical-design from <brief>; stop after <frame | author | review | enforce>.
```

## Development

This repo is a skills pack. The root package is private and exists to provide one contributor and CI
gate; it does not publish the skills.

```bash
pnpm install --frozen-lockfile
pnpm check
```

`pnpm check` runs formatting validation plus the internal eval package's deterministic checks:
skill/profile static checks, Vitest fixture tests, and the seeded `enforce-architecture`
dependency-cruiser evals. Manual or model-graded evals are run directly through
`@agentic-workflow-kit/technical-design-evals`, not root scripts.

## Documentation

- [`docs/product/`](docs/product/) - what this is, where it sits in the suite, and when to use it.
- [`docs/design/`](docs/design/) - methodology mechanics, profile contract, formats, and the
  lessons ledger.

Source lives in [`skills/`](skills/), [`methodologies/`](methodologies/),
[`internal/evals/`](internal/evals/), and [`scripts/`](scripts/).

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
