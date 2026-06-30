# Technical Design Judge Rubric

Rubric version: `judge-rubric-v1`.

Use this rubric only after deterministic graders have passed.

| Criterion | Severity | Pass signal |
|---|---|---|
| Source preservation | critical | Candidate preserves product goals, non-goals, constraints, and required workflows. |
| Boundary coherence | critical | Context ownership is explicit and does not blur producer-owned decisions. |
| Invariant clarity | critical | Guarded predicates name operands, authority, and failure behavior. |
| Planning usefulness | recommended | Delivery facts, sequencing, validation, and stop conditions are extractable. |
| Ceremony fit | recommended | DDD depth fits the case complexity without adding unsupported tactical ceremony. |

Return `unknown` when the candidate lacks enough evidence to judge a criterion. Do not infer missing
facts from reference design wording.
