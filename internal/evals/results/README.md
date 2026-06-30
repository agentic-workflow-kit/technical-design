# Eval Results

Generated eval outputs belong here under `internal/evals/results/<run-id>/`.

This directory is intentionally ignored except for this README. Commit source fixtures, schemas, and
small expected outputs; keep raw run outputs local unless a human reviewer explicitly promotes a
redacted summary.

Expected layout:

```text
internal/evals/results/<run-id>/
  manifest.json
  report.md
  grades.json                    # deterministic case runs only
  pointwise-result.json          # pointwise judge runs only
  pairwise-result.json           # pairwise judge runs only
  final-report.md                # manual report runs only
  promptfooconfig.json           # Promptfoo runs only
  promptfoo-results.json         # Promptfoo runs only
  promptfoo-report.html          # Promptfoo runs only
  cases/<case-id>/candidate.md   # generation or deterministic case runs
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
4. Inspect `pointwise-result.json` or `pairwise-result.json` for model-graded judge details when
   present.
5. Open `promptfoo-results.json` only when debugging provider output or cost/runtime metadata.
6. Open `cases/<case-id>/candidate.md` only when a finding needs source evidence.
