# Pairwise Regression Prompt

Prompt version: `pairwise-prompt-v1`.

Compare two candidate technical designs for the same case. Candidate order is randomized and must be
recorded in the result metadata with method, seed, original order, and candidate order.

Inputs:

- Case id: `{{case_id}}`
- Model: `{{model}}`
- Provider: `{{provider}}`
- Prompt version: `{{prompt_version}}`
- Rubric version: `{{rubric_version}}`
- Product/source facts: `{{source_facts}}`
- Case rubric: `{{case_rubric}}`
- Expected facts and boundaries: `{{expected_facts}}`
- Candidate A: `{{candidate_a}}`
- Candidate B: `{{candidate_b}}`
- Randomization method: `{{randomization_method}}`
- Randomization seed: `{{randomization_seed}}`
- Original candidate order: `{{original_order}}`
- Candidate order: `{{candidate_order}}`

## Rubric

Rubric version: `judge-rubric-v1`.

Use this rubric only after deterministic graders have passed and any pointwise coverage judge results
have been reviewed. Pairwise comparison chooses the stronger candidate overall; it does not prove
that every expected fact or boundary is covered.

| Criterion           | Severity    | Pass signal                                                                        |
| ------------------- | ----------- | ---------------------------------------------------------------------------------- |
| Source preservation | critical    | Candidate preserves product goals, non-goals, constraints, and required workflows. |
| Boundary coherence  | critical    | Context ownership is explicit and does not blur producer-owned decisions.          |
| Invariant clarity   | critical    | Guarded predicates name operands, authority, and failure behavior.                 |
| Planning usefulness | recommended | Delivery facts, sequencing, validation, and stop conditions are extractable.       |
| Ceremony fit        | recommended | DDD depth fits the case complexity without adding unsupported tactical ceremony.   |

## Bias Controls

- Return `unknown` when evidence is insufficient.
- Cite candidate and expected-fact evidence in every result.
- Do not infer missing facts from reference design wording.
- Do not reward length, familiar architecture vocabulary, or rhetorical confidence without source
  support.
- Do not override deterministic or pointwise coverage blockers. If a candidate is better overall but
  still misses required evidence, explain that limitation.

Choose which candidate is more source-grounded, implementation-ready, and enforceable.

Return JSON matching `packages/eval-kit/schemas/pairwise-result.schema.json`.
