# AGENTS.md — technical-design

The contract for working in this repo. **Self-contained:** act on it with only this repo
checked out (including Claude or Codex cloud runs). Don't work from memory — read the doc here
that owns your subject, then plan before non-trivial work.

`technical-design` is a self-contained set of AI skills for the design stage: **resolve** required
inputs, **agree** the system model, **plan** the docs structure, **author** a DDD-first design,
**review** it in a decision-recording loop, **enforce** its boundaries in CI, and **orchestrate** the
flow. Methodology-neutral shell; DDD-first in v1 (profile under `methodologies/ddd/`). It owns one
contract downstream tools build on: the **technical-design document format**.

## Ground truth — read what your task touches

Altitude: `docs/product/` owns _what & why_; `docs/design/` owns _how_.

| Task                                            | Read                                             |
| ----------------------------------------------- | ------------------------------------------------ |
| What the pack is, where it sits, when to use it | `docs/product/` (incl. `when-not-to-use-ddd.md`) |
| Methodology mechanics, formats, principles      | `docs/design/`                                   |
| Contract a new methodology profile must satisfy | `docs/design/methodology-profile-contract.md`    |
| Lessons that hardened the skills                | `docs/design/lessons-ledger.md`                  |

Source lives outside `docs/`: `skills/`, `methodologies/`, `packages/evals/`, `scripts/`. The five
skills are stable; methodology-specific behavior lives under `methodologies/`.

## Gate and conventions

- **`pnpm check`** before claiming any change done; show its output as evidence. It runs
  formatting plus the root-visible non-eval contract checks, then the deterministic eval package
  gate. The enforce gate **requires seeded violations** so the boundary checks cannot pass
  vacuously — preserve that property. A new methodology profile must supply the full contract
  (templates, review rubric, enforcement map, examples, eval expectations).
- **`main`-based:** branch from `main`, PR into it, green `check` required, review conversations
  resolved, squash-merge. Conventional commit subjects; no attribution footers. Worktrees for
  non-trivial work are external siblings of this checkout under `worktrees/technical-design/<branch>`
  — never nested inside it. Use `pnpm worktree:new <branch>` to create one and
  `pnpm worktree:clean <branch>` after merge.
- **No emojis** anywhere. **Immutability.** Validate inputs and handle errors explicitly.
  Diagrams in Mermaid, inline. No hardcoded secrets; redact secrets, tokens, and PII; rotate any
  exposed secret.
