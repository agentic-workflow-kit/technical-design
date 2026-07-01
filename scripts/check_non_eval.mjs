#!/usr/bin/env node
/**
 * Root-visible non-eval validation for the technical-design skills pack.
 *
 * This script deliberately avoids packages/evals so contributors can run cheap
 * static checks for skills, docs, methodology profiles, and contract links
 * without invoking deterministic or model-graded eval flows.
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = path.resolve(import.meta.dirname, "..");
const target = process.argv[2] || "all";
const targets = new Set(["all", "skills", "docs", "methodology", "links"]);
const failures = [];

if (!targets.has(target)) {
  console.error(
    `Usage: check_non_eval.mjs <${Array.from(targets).sort().join("|")}>`,
  );
  process.exit(2);
}

function repoPath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function relative(fullPath) {
  return path.relative(repoRoot, fullPath) || ".";
}

function fail(message) {
  failures.push(message);
}

function assertFile(relativePath, label = "required file") {
  if (
    !fs.existsSync(repoPath(relativePath)) ||
    !fs.statSync(repoPath(relativePath)).isFile()
  ) {
    fail(`${label} missing: ${relativePath}`);
  }
}

function assertDirectory(relativePath, label = "required directory") {
  if (
    !fs.existsSync(repoPath(relativePath)) ||
    !fs.statSync(repoPath(relativePath)).isDirectory()
  ) {
    fail(`${label} missing: ${relativePath}`);
  }
}

function readText(relativePath) {
  try {
    return fs.readFileSync(repoPath(relativePath), "utf8");
  } catch (err) {
    fail(`could not read ${relativePath}: ${err.message}`);
    return "";
  }
}

function assertContains(relativePath, needle, label) {
  const text = readText(relativePath);
  if (!text.includes(needle)) {
    fail(`${label}: ${relativePath} must contain ${JSON.stringify(needle)}`);
  }
}

function listFiles(relativePath, predicate = () => true) {
  const root = repoPath(relativePath);
  if (!fs.existsSync(root)) {
    return [];
  }

  const found = [];
  const pending = [root];
  while (pending.length > 0) {
    const current = pending.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        pending.push(fullPath);
      } else if (entry.isFile() && predicate(fullPath)) {
        found.push(fullPath);
      }
    }
  }
  return found.sort();
}

function checkSkills() {
  assertDirectory("skills", "skills directory");
  const skillDirs = fs
    .readdirSync(repoPath("skills"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  if (skillDirs.length === 0) {
    fail("skills directory must contain at least one skill");
    return;
  }

  for (const skill of skillDirs) {
    const result = spawnSync(
      "python3",
      ["scripts/validate_skill.py", `skills/${skill}`],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    );
    if (result.status !== 0) {
      fail(
        `skill validation failed for skills/${skill}\n${result.stdout}${result.stderr}`,
      );
    }
  }
}

function checkDocs() {
  for (const required of [
    "README.md",
    "docs/README.md",
    "docs/product/README.md",
    "docs/product/when-not-to-use-ddd.md",
    "docs/design/README.md",
    "docs/design/altitude-ladder.md",
    "docs/design/decision-log-format.md",
    "docs/design/evaluation-strategy.md",
    "docs/design/flows.md",
    "docs/design/lessons-ledger.md",
    "docs/design/methodology-profile-contract.md",
    "docs/design/principles.md",
    "docs/design/reference.md",
    "docs/design/suggestion-format.md",
    "docs/design/technical-design-handoff-contract.md",
  ]) {
    assertFile(required, "documentation file");
  }

  assertContains(
    "docs/README.md",
    "[design/](./design/)",
    "docs index must link design docs",
  );
  assertContains(
    "docs/design/README.md",
    "methodology-profile-contract.md",
    "design docs index must link methodology profile contract",
  );
  assertContains(
    "docs/product/README.md",
    "when-not-to-use-ddd.md",
    "product docs index must link DDD guidance",
  );

  const publicTextFiles = [
    "README.md",
    ...listFiles("docs", (file) => file.endsWith(".md")).map(relative),
    ...listFiles("methodologies", (file) => file.endsWith(".md")).map(relative),
    ...listFiles("skills", (file) => file.endsWith(".md")).map(relative),
  ];
  const privateNamePattern = new RegExp(
    ["path" + "way", "on" + "class", "on-" + "class"].join("|"),
    "i",
  );
  for (const file of publicTextFiles) {
    if (privateNamePattern.test(readText(file))) {
      fail(
        `private application repository name leaked into public text: ${file}`,
      );
    }
  }
}

function checkMethodology() {
  for (const required of [
    "methodologies/README.md",
    "methodologies/ddd/README.md",
    "methodologies/ddd/templates/technical-design.md",
    "methodologies/ddd/templates/enforcement-map.md",
    "methodologies/ddd/review-rubric.md",
    "methodologies/ddd/enforcement-rules.md",
    "methodologies/ddd/eval-expectations.md",
    "docs/design/lessons-ledger.md",
  ]) {
    assertFile(required, "methodology profile file");
  }

  assertContains(
    "methodologies/README.md",
    "../docs/design/methodology-profile-contract.md",
    "methodologies index must point at the profile contract",
  );
  assertContains(
    "methodologies/ddd/templates/technical-design.md",
    "handoff_contract: technical-design-handoff-v0",
    "DDD design template must expose handoff frontmatter",
  );
  assertContains(
    "methodologies/ddd/templates/technical-design.md",
    "Planner Handoff Summary",
    "DDD design template must include planner handoff summary",
  );
  assertContains(
    "methodologies/ddd/templates/enforcement-map.md",
    '"seededViolation"',
    "DDD enforcement map template must require seeded violations",
  );
}

function normalizeMarkdownHref(rawHref) {
  const trimmed = rawHref.trim();
  const angleWrapped = trimmed.match(/^<([^>]+)>$/);
  const href = angleWrapped ? angleWrapped[1] : trimmed.split(/\s+/)[0];
  if (!href || href.startsWith("#") || /^[a-z][a-z0-9+.-]*:/i.test(href)) {
    return null;
  }
  const [withoutAnchor] = href.split("#");
  return withoutAnchor || null;
}

function checkMarkdownLinks() {
  const markdownFiles = [
    "README.md",
    "AGENTS.md",
    ...listFiles("docs", (file) => file.endsWith(".md")).map(relative),
    ...listFiles("methodologies", (file) => file.endsWith(".md")).map(relative),
    ...listFiles("skills", (file) => file.endsWith(".md")).map(relative),
  ];
  const linkPattern = /!?\[[^\]\n]*\]\(([^)\n]+)\)/g;

  for (const file of markdownFiles) {
    const text = readText(file);
    for (const match of text.matchAll(linkPattern)) {
      const href = normalizeMarkdownHref(match[1]);
      if (!href) {
        continue;
      }

      let decodedHref;
      try {
        decodedHref = decodeURIComponent(href);
      } catch {
        fail(`invalid encoded markdown link in ${file}: ${href}`);
        continue;
      }

      const resolved = path.resolve(path.dirname(repoPath(file)), decodedHref);
      if (!resolved.startsWith(repoRoot + path.sep) && resolved !== repoRoot) {
        fail(`markdown link escapes repository in ${file}: ${href}`);
        continue;
      }
      if (!fs.existsSync(resolved)) {
        fail(`broken markdown link in ${file}: ${href}`);
      }
    }
  }
}

function checkContractReferences() {
  for (const artifact of [
    "methodologies/ddd/templates/technical-design.md",
    "skills/author-technical-design/templates/design-doc.md",
    "skills/author-technical-design/examples/simple-crud.md",
    "skills/author-technical-design/examples/domain-heavy.md",
  ]) {
    assertContains(
      artifact,
      "handoff_contract: technical-design-handoff-v0",
      "authoring artifact must expose handoff contract frontmatter",
    );
    assertContains(
      artifact,
      "## 1. Planner Handoff Summary",
      "authoring artifact must include the planner handoff section",
    );
    assertContains(
      artifact,
      "architecture_mode",
      "authoring artifact must expose architecture_mode",
    );
    assertContains(
      artifact,
      "InputResolution",
      "authoring artifact must preserve InputResolution",
    );
    assertContains(
      artifact,
      "AgreedSystemModel",
      "authoring artifact must preserve AgreedSystemModel",
    );
    assertContains(
      artifact,
      "DocStructurePlan",
      "authoring artifact must preserve DocStructurePlan",
    );
    for (const approvalLine of [
      "InputResolution approval status",
      "AgreedSystemModel approval status",
      "DocStructurePlan approval status",
    ]) {
      assertContains(
        artifact,
        approvalLine,
        `authoring artifact ${artifact} must expose ${approvalLine}`,
      );
    }
  }

  for (const reference of [
    [
      "skills/author-technical-design/SKILL.md",
      "../../docs/design/technical-design-handoff-contract.md",
      "author skill must reference the handoff contract",
    ],
    [
      "skills/review-technical-design/SKILL.md",
      "../../docs/design/technical-design-handoff-contract.md",
      "review skill must reference the handoff contract",
    ],
    [
      "skills/orchestrate-technical-design/SKILL.md",
      "../../docs/design/methodology-profile-contract.md",
      "orchestrator skill must reference the profile contract",
    ],
  ]) {
    assertContains(reference[0], reference[1], reference[2]);
  }

  assertContains(
    "skills/review-technical-design/templates/suggestion.schema.json",
    "agreement-integrity",
    "review suggestion schema must include the agreement-integrity lens",
  );
  for (const reviewSurface of [
    "skills/review-technical-design/SKILL.md",
    "methodologies/ddd/review-rubric.md",
  ]) {
    for (const category of [
      "SRC",
      "CTX",
      "INV",
      "SURF",
      "FAIL",
      "OBS",
      "ENF",
      "DEL",
      "SEQ",
      "FILE",
      "VAL",
      "STOP",
    ]) {
      assertContains(
        reviewSurface,
        category,
        `review surface ${reviewSurface} must require handoff category ${category}`,
      );
    }
    assertContains(
      reviewSurface,
      "source-backed rationale",
      `review surface ${reviewSurface} must require source-backed rationale for None categories`,
    );
  }
  assertContains(
    "docs/product/README.md",
    "design-to-plan",
    "product docs must name the Planning layer",
  );
}

function checkLinks() {
  checkMarkdownLinks();
  checkContractReferences();
}

const selectedChecks =
  target === "all"
    ? [checkSkills, checkDocs, checkMethodology, checkLinks]
    : [];
if (target === "skills") {
  selectedChecks.push(checkSkills);
}
if (target === "docs") {
  selectedChecks.push(checkDocs);
}
if (target === "methodology") {
  selectedChecks.push(checkMethodology);
}
if (target === "links") {
  selectedChecks.push(checkLinks);
}

for (const check of selectedChecks) {
  check();
}

if (failures.length > 0) {
  console.error(`Non-eval ${target} checks failed:`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Non-eval ${target} checks passed.`);
