# Frame Eval - Source-grounded DDD Intake

## Prompt

Design account subscription cancellation. The PRD says cancellations take effect at period end, but
support can force immediate cancellation.

## Expected behavior

- Reads PRD/design/source surfaces before asking questions.
- Produces a source map.
- Names candidate contexts such as Subscription Management and Support Operations.
- Identifies ownership uncertainty for forced cancellation authority.
- Selects at least `use-case-slices` depth because cancellation has lifecycle and authorization rules.
- Asks only blocking questions that affect ownership, policy, data, or tests.
