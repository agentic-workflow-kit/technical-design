#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

for skill in skills/*; do
  python3 scripts/validate_skill.py "$skill" >/dev/null
done

node -e "JSON.parse(require('fs').readFileSync('skills/review-technical-design/templates/suggestion.schema.json', 'utf8'))"
node evals/validate_eval_fixtures.mjs

required=(
  "docs/design/technical-design-handoff-contract.md"
  "methodologies/README.md"
  "methodologies/ddd/README.md"
  "methodologies/ddd/templates/technical-design.md"
  "methodologies/ddd/templates/enforcement-map.md"
  "methodologies/ddd/review-rubric.md"
  "methodologies/ddd/enforcement-rules.md"
  "methodologies/ddd/eval-expectations.md"
  "docs/design/lessons-ledger.md"
)

for path in "${required[@]}"; do
  if [ ! -f "$path" ]; then
    echo "missing required profile file: $path" >&2
    exit 1
  fi
done

if ! grep -qF "handoff_contract: technical-design-handoff-v0" methodologies/ddd/templates/technical-design.md; then
  echo "DDD technical-design template must expose the planner handoff contract frontmatter" >&2
  exit 1
fi

if ! grep -qF "Planner Handoff Summary" methodologies/ddd/templates/technical-design.md; then
  echo "DDD technical-design template must include a Planner Handoff Summary" >&2
  exit 1
fi

if ! grep -qF "Required handoff data" evals/planning/design-to-planning-input.example.md; then
  echo "planning fixture must distinguish required handoff data" >&2
  exit 1
fi

if ! grep -qF "Methodology-specific detail" evals/planning/design-to-planning-input.example.md; then
  echo "planning fixture must distinguish methodology-specific detail" >&2
  exit 1
fi

author_handoff_artifacts=(
  "skills/author-technical-design/templates/design-doc.md"
  "skills/author-technical-design/examples/simple-crud.md"
  "skills/author-technical-design/examples/domain-heavy.md"
)

for path in "${author_handoff_artifacts[@]}"; do
  if ! grep -qF "handoff_contract: technical-design-handoff-v0" "$path"; then
    echo "author artifact missing planner handoff frontmatter: $path" >&2
    exit 1
  fi
  if ! grep -qF "## 1. Planner Handoff Summary" "$path"; then
    echo "author artifact missing Planner Handoff Summary: $path" >&2
    exit 1
  fi
done

private_name_pattern='path''way|on''class|on-''class'
if grep -RIEi --exclude-dir=.git --exclude-dir=node_modules "$private_name_pattern" .; then
  echo "private application repository name leaked into public docs" >&2
  exit 1
fi

echo "Static checks passed."
