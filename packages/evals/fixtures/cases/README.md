# Product-to-Design Cases

Cases are self-contained fixtures for deterministic product-to-design grading. They must not depend on
live fetches, private repository facts, or private product names.

This is the local `technical-design` case model. It is not a shared package contract and should not
be generalized across repositories without a separate design decision.

## Local Eval Layers

The repository uses a layered eval model. Do not collapse these layers into a numeric average.

| Layer | Purpose | Gate |
| --- | --- | --- |
| 1. Static/schema gates | Repo and fixture contract safety. | Always blocking. |
| 2. Skill fixtures | Specific skill behavior. | Blocking when deterministic. |
| 3. Defect injection | Known bad patterns must be caught. | Blocking when deterministic or enforceable. |
| 4. Product-to-design cases | Full design quality from source inputs. | Deterministic facts and boundaries block; judges advise until calibrated. |
| 5. Downstream outcome studies | Measure downstream delivery friction. | Manual and periodic only for now. |

Layer 4 deterministic case runs emit only `red`, `yellow`, or `green`. `great` is
manual/report-level only after green deterministic coverage and calibrated pairwise evidence.

Verdict aggregation is gate-oriented:

1. Static/schema failure is `red`.
2. Critical deterministic fact or boundary missing, contradicted, or invented is `red`.
3. No blockers but unresolved recommended or semantic issues is `yellow`.
4. Deterministic source, fact, and boundary bar passed is `green`.
5. `green` plus calibrated pairwise win can be reported as `great` manually.

## Case Purpose

Every case must declare one primary type in `grader-notes.md`:

- `tiny_contract`
- `ddd_heavy`
- `negative_fit_low_ceremony`
- `integration_api_seam`
- `state_machine_lifecycle`
- `control_plane_runtime`

Each case should prove one primary thing deterministically, expose one common bad design class, and
leave semantic quality to calibrated judges. Product-to-design cases are not exact answer-key tests
and should not grade a favorite decomposition unless the visible sources force it.

## Case Layout

```text
fixtures/cases/<case-id>/
  product.md
  source-map.md
  reference-design.md
  expected-facts.json
  expected-boundaries.json
  rubric.md
  grader-notes.md
  provenance.md
```

## File Rules

### `product.md`

`product.md` is generation-visible product intent only. It may include:

- problem;
- users or actors;
- goals;
- non-goals;
- critical workflows;
- constraints;
- required states, events, or APIs;
- failure and consistency concerns.

Do not hide deterministic design requirements outside `product.md` and `source-map.md`.

### `source-map.md`

`source-map.md` must define stable `SRC-*` IDs. Every expected fact and boundary must cite source
IDs visible in `product.md` or `source-map.md`. If an expectation cannot cite visible source IDs, it
cannot be deterministic expected evidence.

### `expected-facts.json`

Use expected facts for source-visible requirements that must hold regardless of valid design
decomposition:

- invariants;
- states;
- events;
- commands;
- public APIs;
- non-goals;
- workflow requirements;
- source-visible constraints;
- failure tokens.

Each fact should use:

- `id`;
- `category`;
- `severity`;
- `source_refs`;
- `description`;
- `must_include_any`;
- `must_include_all`, when all named evidence must be present;
- `must_not_include_any`, for contradictions or invented scope;
- `accepted_alternatives`, when source-equivalent exact wording should pass;
- `required_concepts`, when exact phrasing would be too brittle.

Use `must_not_include_any` for contradictions or invented scope, not style preferences.

### `expected-boundaries.json`

Use expected boundaries for ownership, not preferred vocabulary. Each context should use:

- `id`;
- `name`;
- `source_refs`;
- `owns`;
- `reads`;
- `does_not_own`;
- `must_include_all`;
- `must_not_include_any`, when contradictory ownership should block;
- `accepted_alternatives`, when source-equivalent decomposition or naming should pass;
- `required_concepts`, when source-equivalent wording should pass without exact phrases.

Boundary rules:

- Source facts must appear in `product.md` or `source-map.md`.
- `expected-facts.json` and `expected-boundaries.json` must cite source IDs.
- Expected facts and boundaries must be derivable from generation-visible inputs: `product.md` and
  `source-map.md`. Do not require wording or product scope that appears only in the reference design,
  rubric, or grader notes.
- `must_include_all` is required co-located ownership evidence for boundaries.
- Use `accepted_alternatives` and `required_concepts` for source-equivalent wording instead of
  encoding one preferred sentence shape as the only passing answer.
- Boundary fixtures may declare `accepted_alternatives` for source-equivalent ownership evidence.
- Deterministic checks should grade explicit facts, boundaries, and contradictions, not prose style.
- Do not force a favorite DDD decomposition unless source facts require it.
- If sources name aggregates, domain services, workflow services, or service candidates, expected
  boundaries should state whether they require standalone ownership evidence or may be covered as
  internal sub-boundaries inside a larger context.

### `reference-design.md`

`reference-design.md` is a compact comparison anchor, not an answer key. It should:

- pass deterministic checks;
- stay source-grounded;
- avoid hidden facts;
- show one strong possible decomposition;
- avoid implying it is the only valid design.

### `rubric.md`

`rubric.md` is for semantic or model judging only. It may describe:

- excellent design qualities;
- acceptable alternatives;
- over-design;
- under-design;
- yellow versus red judgment;
- when to return `unknown`.

It must not contain hidden deterministic requirements.

### `grader-notes.md`

`grader-notes.md` is for maintainers. It must include a `## Case Purpose` section with these keys:

```text
case_type:
primary_capability:
secondary_capability:
what_this_case_must_not_test:
required_deterministic_blockers:
acceptable_design_alternatives:
bad_candidate_snippets:
future_adjustment_notes:
```

Use `bad_candidate_snippets` to document short examples that should fail the deterministic grader or
be treated as semantic defects. Keep snippets generic and source-grounded.

### `provenance.md`

For public or sourced cases, record:

- source URLs;
- license notes;
- what was summarized or derived;
- snapshot date when applicable;
- why committed fixture text is safe.

Synthetic cases should still state that they are internally authored and do not copy external or
private material.

## Operating Rules

- Generated outputs belong under ignored `packages/evals/results/<run-id>/`.
- Do not add external text unless its license allows committed fixtures and `provenance.md` records it.
- Model-graded Promptfoo and Codex judge runs remain advisory until human calibration exists.
- Reference designs are comparison anchors, not exact answer keys.
