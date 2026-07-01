#!/usr/bin/env node
/**
 * Deterministic enforce eval.
 *
 * Proves the layer-map generator produces correct, non-vacuous rules for any
 * layer taxonomy (hexagonal AND non-hexagonal), and declines gracefully when a
 * design has no boundaries. Replaces evals/src/run_enforce_eval.sh.
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = path.resolve(import.meta.dirname, "..");
const fixtureRoot = path.join(repoRoot, "evals/fixtures/enforce");
const generator = path.join(
  repoRoot,
  "skills/enforce-architecture/scripts/generate_depcruise.mjs",
);
const depcruise = path.join(repoRoot, "node_modules/.bin/depcruise");

if (!fs.existsSync(depcruise)) {
  console.error(
    `error: ${depcruise} not found - run 'pnpm install --frozen-lockfile' in ${repoRoot}`,
  );
  process.exit(2);
}

let failures = 0;

function runCase(name, mapFile, expectedOutcome) {
  console.log(`=== ${name} (expect: ${expectedOutcome}) ===`);

  const configOut = path.join(fixtureRoot, ".dependency-cruiser.cjs");
  const gen = spawnSync(
    process.execPath,
    [generator, path.join(fixtureRoot, mapFile), "--output", configOut],
    { cwd: fixtureRoot, encoding: "utf8" },
  );
  if (gen.status !== 0) {
    console.error(`generator failed for ${name}: ${gen.stderr.trim()}`);
    failures++;
    return;
  }

  const srcDir = path.join(fixtureRoot, "src");
  const cruise = spawnSync(depcruise, ["--config", configOut, srcDir], {
    cwd: fixtureRoot,
    encoding: "utf8",
  });
  const exitCode = cruise.status ?? 1;

  const passed =
    (expectedOutcome === "fail" && exitCode !== 0) ||
    (expectedOutcome === "pass" && exitCode === 0);

  if (passed) {
    console.log(`OK: ${name} behaved as expected (exit=${exitCode})`);
  } else {
    console.error(
      `FAIL: ${name} expected '${expectedOutcome}' but depcruise exit=${exitCode}`,
    );
    failures++;
  }
  console.log();
}

// rung 3: hexagonal domain -> infra (must fire)
runCase("hexagonal", "hexagonal-layer-map.json", "fail");
// rung 2: layered model -> controller (NON-hexagonal rule must fire)
runCase("layered", "layered-layer-map.json", "fail");
// rung 1: simple CRUD, no boundaries — generator declines, gate passes honestly
runCase("crud", "crud-layer-map.json", "pass");

if (failures > 0) {
  console.error("EVALS FAILED");
  process.exit(1);
}
console.log("All evals passed.");
