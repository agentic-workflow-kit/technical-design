#!/usr/bin/env bash
# Deterministic enforce eval.
# Proves the layer-map generator produces correct, NON-vacuous rules for any layer
# taxonomy (hexagonal AND non-hexagonal), and declines gracefully when a design has
# no boundaries. cwd-independent; uses the pinned local dependency-cruiser with an
# explicit --config (no npx, no config auto-discovery).
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
PACKAGE_ROOT="$REPO_ROOT/internal/evals"
FIXTURE_ROOT="$PACKAGE_ROOT/fixtures/enforce"
cd "$FIXTURE_ROOT"

GEN="$REPO_ROOT/skills/enforce-architecture/scripts/generate_depcruise.mjs"
DEPCRUISE="$PACKAGE_ROOT/node_modules/.bin/depcruise"

if [ ! -x "$DEPCRUISE" ]; then
  echo "error: $DEPCRUISE not found - run 'pnpm install --frozen-lockfile' in $REPO_ROOT" >&2
  exit 2
fi

failures=0
run_case() {
  # $1 name, $2 layer-map, $3 expected outcome (fail|pass)
  local name="$1" map="$2" expect="$3" code
  echo "=== $name (expect: $expect) ==="
  node "$GEN" "$map" --output .dependency-cruiser.cjs
  "$DEPCRUISE" --config .dependency-cruiser.cjs src
  code=$?
  if { [ "$expect" = fail ] && [ "$code" -ne 0 ]; } || { [ "$expect" = pass ] && [ "$code" -eq 0 ]; }; then
    echo "OK: $name behaved as expected (exit=$code)"
  else
    echo "FAIL: $name expected '$expect' but depcruise exit=$code" >&2
    failures=1
  fi
  echo
}

# rung 3: hexagonal domain -> infra (must fire)
run_case hexagonal hexagonal-layer-map.json fail
# rung 2: layered model -> controller (NON-hexagonal rule must fire) - proves layer-driven generation
run_case layered   layered-layer-map.json   fail
# rung 1: simple CRUD, no boundaries - generator declines, gate passes honestly (not vacuously)
run_case crud      crud-layer-map.json      pass

if [ "$failures" -ne 0 ]; then
  echo "EVALS FAILED" >&2
  exit 1
fi
echo "All evals passed."
