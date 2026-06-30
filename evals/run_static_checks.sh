#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

for skill in skills/*; do
  python3 scripts/validate_skill.py "$skill" >/dev/null
done

node -e "JSON.parse(require('fs').readFileSync('skills/review-technical-design/templates/suggestion.schema.json', 'utf8'))"

required=(
  "methodologies/README.md"
  "methodologies/ddd/README.md"
  "methodologies/ddd/templates/technical-design.md"
  "methodologies/ddd/templates/enforcement-map.md"
  "methodologies/ddd/review-rubric.md"
  "methodologies/ddd/enforcement-rules.md"
  "methodologies/ddd/eval-expectations.md"
  "docs/lessons-ledger.md"
)

for path in "${required[@]}"; do
  if [ ! -f "$path" ]; then
    echo "missing required profile file: $path" >&2
    exit 1
  fi
done

private_name_pattern='path''way|on''class|on-''class'
if rg -i "$private_name_pattern" . --glob '!evals/enforce/node_modules/**' --glob '!node_modules/**'; then
  echo "private application repository name leaked into public docs" >&2
  exit 1
fi

echo "Static checks passed."
