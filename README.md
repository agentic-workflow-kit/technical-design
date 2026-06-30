# technical-design

A self-contained set of AI skills for technical design: **frame** the problem, **author** a
right-sized design, **review** it in a decision-recording loop, **enforce** its boundaries in CI, and
**orchestrate** the whole flow. Stands alone today; named to slot into the agentic-workflow-kit suite
later as its design stage.

It is **architecture-method-agnostic** — it picks the smallest architecture that fits and only reaches
for DDD when complexity earns it. Inspired by
[`Sairyss/domain-driven-hexagon`](https://github.com/Sairyss/domain-driven-hexagon), but it does not
force DDD, hexagonal, or any pattern.

> **Status:** Built and ready for use. See `flows.md` and `skills/` directory for details.

---

## What it is

Strong models already hold the design *knowledge* ("define boundaries", "don't overengineer").
Repeating it changes nothing. This pack packages the parts a model won't do on its own:

1. **Ask the right questions first** — surface blocking unknowns before drafting.
2. **Choose the right altitude** — the smallest architecture that fits, justified; DDD only when earned.
3. **Review as a loop, not a verdict** — suggestions you decide on, with every decision recorded.
4. **Make boundaries executable** — a CI gate that fails when the domain imports the database.

## What it provides — five skills, one flow

```text
FRAME ───────────► AUTHOR ──────────► REVIEW ◄──loop──► DECIDE ──────────► ENFORCE
frame-technical-    author-technical-   review-technical-   user disposes      enforce-
design              design              design              + record           architecture
clarify + scope     right-sized draft   suggest fixes       decisions.md       boundaries → CI gate

        └──────────────────────── orchestrate-technical-design ────────────────────────┘
                                   (runs the whole flow; built last)
```

- **`frame-technical-design`** — clarifying questions + complexity drivers (divergent intake).
- **`author-technical-design`** — the design doc: stated altitude, boundaries, use-case slices,
  failure/consistency, risks, boundary rules. Tactical DDD only when complexity earns it.
- **`review-technical-design`** — emits severity-tagged **suggestions** (never auto-edits) + over/under-
  engineering flags. You dispose of each; decisions land in `decisions.md`. Settled = no blocking
  suggestion open.
- **`enforce-architecture`** — turns boundaries into a `dependency-cruiser` + ESLint + CI gate. The
  verifiable payoff.
- **`orchestrate-technical-design`** — composes the four into the full flow, pausing for your
  decisions, stopping where you ask.

## How to use

```text
# full design
Use frame-technical-design, then author-technical-design, then review (loop), then enforce.
Context: <brief / PRD>, stack, scale, constraints.

# review an existing design (RFC)
Use review-technical-design on <design>. Give me suggestions + over/under flags; I'll dispose, you record.

# hands-off
Use orchestrate-technical-design from <brief>; stop after <review | enforce>.
```

## When to use it / when not

**Use it** for a service with real domain logic, external dependencies, and consistency concerns,
when you want the boundaries to stick. **Skip it** for thin CRUD or glue — `author` will tell you to
use a layered service or MVC and stop. That's the point: a check against ceremony, not a generator of
it.

## What this deliberately is *not*

- Not a DDD template — no base classes to copy; you reuse the judgment, not the framework.
- Not framework-specific — no NestJS, no folder structure to mirror.
- Not DDD-by-default — tactical DDD is opt-in, chosen only when complexity drivers are present.

Start simple. Add architecture only when complexity earns it. Make the important rules enforceable.
