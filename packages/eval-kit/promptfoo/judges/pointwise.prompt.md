# Pointwise Coverage Prompt

Prompt version: `pointwise-prompt-v1`.

Grade one candidate technical design item-by-item against the visible source inputs and expected
coverage items for the case. This is an advisory coverage pass, not a holistic design ranking.

Inputs:

- Case id: `{{case_id}}`
- Model: `{{model}}`
- Provider: `{{provider}}`
- Prompt version: `{{prompt_version}}`
- Rubric version: `{{rubric_version}}`
- Product/source inputs: `{{source_facts}}`
- Case rubric: `{{case_rubric}}`
- Expected items: `{{expected_items}}`
- Candidate path: `{{candidate_path}}`
- Candidate: `{{candidate}}`

## Rubric

Rubric version: `pointwise-coverage-rubric-v1`.

For each expected item:

- Use `covered` only when the candidate clearly preserves the item with direct supporting excerpts.
- Use `partial` when the candidate addresses part of the item but omits a required detail.
- Use `missing` when the candidate does not provide enough support for the item.
- Use `contradicted` when the candidate conflicts with the expected item.
- Use `unknown` only when the candidate is too ambiguous to judge even after reading the visible
  sources and expected item metadata.

## Bias Controls

- Judge only against `product.md`, `source-map.md`, expected facts, expected boundaries, and the
  candidate. Use `rubric.md` only for semantic guidance, not hidden deterministic requirements.
- Do not use or infer from `reference-design.md`, grader notes, review rubrics, or hidden answer
  keys.
- Do not reward length, familiar architecture vocabulary, or rhetorical confidence without source
  support.
- `covered`, `partial`, and `contradicted` must each include at least one direct candidate evidence
  excerpt.
- Preserve each item's `item_id`, `kind`, `severity`, and `source_refs` exactly as provided.

Return JSON matching `packages/eval-kit/schemas/pointwise-judge-result.schema.json`.
