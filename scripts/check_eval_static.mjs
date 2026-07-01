#!/usr/bin/env node
/**
 * Static eval checks for the technical-design repo.
 *
 * Validates skills, required profile files, template contracts, planning
 * fixture markers, and author artifact contracts. Replaces evals/src/run_static_checks.sh.
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const repoRoot = path.resolve(import.meta.dirname, "..");
const failures = [];

function repoPath(rel) {
  return path.join(repoRoot, rel);
}

function fail(msg) {
  failures.push(msg);
}

function assertFile(rel) {
  if (!fs.existsSync(repoPath(rel)) || !fs.statSync(repoPath(rel)).isFile()) {
    fail(`required file missing: ${rel}`);
  }
}

function readText(rel) {
  try {
    return fs.readFileSync(repoPath(rel), "utf8");
  } catch (err) {
    fail(`could not read ${rel}: ${err.message}`);
    return "";
  }
}

// Validate skills via existing validate_skill.py
const skillsDir = repoPath("skills");
if (fs.existsSync(skillsDir)) {
  for (const entry of fs.readdirSync(skillsDir)) {
    const skillPath = path.join(skillsDir, entry);
    if (!fs.statSync(skillPath).isDirectory()) continue;
    const result = spawnSync(
      "python3",
      [repoPath("scripts/validate_skill.py"), skillPath],
      { encoding: "utf8" },
    );
    if (result.status !== 0) {
      fail(`skill validation failed for ${entry}: ${result.stderr.trim()}`);
    }
  }
}

// Validate suggestion schema is valid JSON
const suggestionSchemaPath =
  "skills/review-technical-design/templates/suggestion.schema.json";
try {
  JSON.parse(readText(suggestionSchemaPath));
} catch (err) {
  fail(`${suggestionSchemaPath} is not valid JSON: ${err.message}`);
}

// Run eval-kit validate-fixtures
const evalKitBin = repoPath("packages/eval-kit/bin/eval-kit.mjs");
const evalConfig = repoPath("evals/eval-kit.config.json");
const result = spawnSync(
  process.execPath,
  [evalKitBin, "validate-fixtures", "--config", evalConfig],
  { encoding: "utf8", cwd: repoRoot },
);
if (result.status !== 0) {
  fail(`eval-kit validate-fixtures failed:\n${result.stderr.trim()}`);
}

// Required profile files
const required = [
  "docs/design/technical-design-handoff-contract.md",
  "methodologies/README.md",
  "methodologies/ddd/README.md",
  "methodologies/ddd/templates/technical-design.md",
  "methodologies/ddd/templates/enforcement-map.md",
  "methodologies/ddd/review-rubric.md",
  "methodologies/ddd/enforcement-rules.md",
  "methodologies/ddd/eval-expectations.md",
  "docs/design/lessons-ledger.md",
];
for (const rel of required) {
  assertFile(rel);
}

// DDD template contract checks
const dddTemplate = readText("methodologies/ddd/templates/technical-design.md");
if (!dddTemplate.includes("handoff_contract: technical-design-handoff-v0")) {
  fail(
    "DDD technical-design template must expose the planner handoff contract frontmatter",
  );
}
if (!dddTemplate.includes("Planner Handoff Summary")) {
  fail("DDD technical-design template must include a Planner Handoff Summary");
}

// Planning fixture checks
const planningFixture = readText(
  "evals/fixtures/planning/design-to-planning-input.example.md",
);
if (!planningFixture.includes("Required handoff data")) {
  fail("planning fixture must distinguish required handoff data");
}
if (!planningFixture.includes("Methodology-specific detail")) {
  fail("planning fixture must distinguish methodology-specific detail");
}

// Author handoff artifact checks
const authorHandoffArtifacts = [
  "skills/author-technical-design/templates/design-doc.md",
  "skills/author-technical-design/examples/simple-crud.md",
  "skills/author-technical-design/examples/domain-heavy.md",
];
for (const rel of authorHandoffArtifacts) {
  const text = readText(rel);
  if (!text.includes("handoff_contract: technical-design-handoff-v0")) {
    fail(`author artifact missing planner handoff frontmatter: ${rel}`);
  }
  if (!text.includes("## 1. Planner Handoff Summary")) {
    fail(`author artifact missing Planner Handoff Summary: ${rel}`);
  }
}

// Private name leak check
// Split strings to avoid this file matching its own private-name leak check
const privatePattern = new RegExp(
  ["path" + "way", "on" + "class", "on-" + "class"].join("|"),
  "gi",
);
const ignoreDirs = new Set([
  ".git",
  "node_modules",
  "evals/results",
  ".pnpm-store",
]);

function walkAndCheck(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const rel = path.relative(repoRoot, fullPath);
    if (ignoreDirs.has(rel) || ignoreDirs.has(entry.name)) continue;
    if (entry.isDirectory()) {
      walkAndCheck(fullPath);
    } else if (entry.isFile()) {
      let text;
      try {
        text = fs.readFileSync(fullPath, "utf8");
      } catch {
        continue;
      }
      if (privatePattern.test(text)) {
        fail(`private application repository name leaked in: ${rel}`);
      }
      privatePattern.lastIndex = 0; // reset after global test
    }
  }
}
walkAndCheck(repoRoot);

// Final report
if (failures.length > 0) {
  console.error(
    "Static checks failed:\n" + failures.map((f) => `  - ${f}`).join("\n"),
  );
  process.exit(1);
}
console.log("Static checks passed.");
