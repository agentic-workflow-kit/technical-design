# Eval Results

Generated eval outputs belong here under `evals/results/<run-id>/`.

This directory is intentionally ignored except for this README. Commit source fixtures, schemas, and
small expected outputs; keep raw run outputs local unless a human reviewer explicitly promotes a
redacted summary.

Expected layout:

```text
evals/results/<run-id>/
  manifest.json
  report.md
  grades.json
  cases/<case-id>/
    candidate.md
    grader-output.json
```

Minimum `manifest.json` fields:

- git commit;
- command;
- case ids;
- tool versions;
- deterministic or model-graded run type;
- model/provider metadata when applicable;
- output files written.

How to read a result bundle:

1. Start with `manifest.json` for provenance and tool versions.
2. Read `report.md` for the blocker-first summary.
3. Inspect `grades.json` for machine-readable verdicts.
4. Open `cases/<case-id>/candidate.md` and `grader-output.json` only when a finding needs source
   evidence.
