# Candidate Generation Prompt

Prompt version: `generation-prompt-v1`.

Generate one technical design candidate for the requested eval case.

Inputs:

- Case id: `{{case_id}}`
- Product brief: `{{product_md}}`
- Source map: `{{source_map_md}}`
- Author skill: `{{author_skill_md}}`
- Technical design template: `{{technical_design_template_md}}`
- Bounded context template: `{{bounded_context_template_md}}`
- Enforcement map template: `{{enforcement_map_template_md}}`
- Eval expectations: `{{ddd_eval_expectations_md}}`

Use only the visible product and source inputs. Do not infer requirements from hidden reference
designs, grader notes, or prior runs. Preserve explicit product goals, constraints, non-goals, and
source-visible ownership boundaries. When evidence is missing, name the uncertainty instead of
inventing implementation facts.

Return Markdown for the candidate technical design only.
