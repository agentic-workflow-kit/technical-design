## Review — <design name>  (round N)

**Verdict:** <settled | open: X blocking, Y recommended>
**Over-engineering flags:** <…>   **Under-engineering flags:** <…>

| id    | sev        | dimension | finding                          | proposed fix                  |
|-------|------------|-----------|----------------------------------|-------------------------------|
| S-001 | blocking   | boundary  | domain imports the DB model      | introduce a repository port   |
| S-002 | recommended| consistency| no idempotency on retried write | add idempotency key on <cmd>  |
| S-003 | optional   | testability| no test seam for <adapter>      | inject port; add a test double|

_Disposition_: reply per id with **fix / reject / defer (+reason)** → recorded to `decisions.md`.
