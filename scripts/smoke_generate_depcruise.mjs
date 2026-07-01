#!/usr/bin/env node
/**
 * Lightweight smoke checks for the enforce-architecture dependency-cruiser generator.
 *
 * These checks stay outside packages/evals so root tooling can prove generator
 * fail-closed behavior without depending on eval fixtures or model-graded flows.
 */

import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = path.resolve(import.meta.dirname, "..");
const generator = path.join(
  repoRoot,
  "skills/enforce-architecture/scripts/generate_depcruise.mjs",
);
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "depcruise-smoke-"));
const require = createRequire(import.meta.url);

const failures = [];

function writeJson(relativePath, value) {
  const fullPath = path.join(tempRoot, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, JSON.stringify(value, null, 2));
  return fullPath;
}

function runGenerator(mapPath, outputPath) {
  return spawnSync(
    process.execPath,
    [generator, mapPath, "--output", outputPath],
    {
      cwd: repoRoot,
      encoding: "utf8",
    },
  );
}

function record(condition, message, detail = "") {
  if (condition) {
    console.log(`ok - ${message}`);
    return;
  }

  failures.push(detail ? `${message}\n${detail}` : message);
  console.error(`not ok - ${message}`);
  if (detail) {
    console.error(detail);
  }
}

const baseLayers = [
  { name: "domain", path: "src/domain" },
  { name: "infrastructure", path: "src/infrastructure" },
];

const missingSeedMap = writeJson("missing-seededViolation.json", {
  layers: baseLayers,
  forbidden: [
    {
      from: "domain",
      to: "infrastructure",
      reason: "Domain must not depend on infrastructure",
    },
  ],
});
const missingSeed = runGenerator(
  missingSeedMap,
  path.join(tempRoot, "missing-seededViolation.cjs"),
);
record(
  missingSeed.status !== 0 && missingSeed.stderr.includes("seededViolation"),
  "missing seededViolation fails closed",
  missingSeed.stderr || missingSeed.stdout,
);

const missingLayerMap = writeJson("missing-layer-reference.json", {
  layers: baseLayers,
  forbidden: [
    {
      from: "domain",
      to: "application",
      reason: "Domain must not depend on application",
      seededViolation:
        "src/domain/__architecture__/domain-imports-application.seed.ts",
    },
  ],
});
const missingLayer = runGenerator(
  missingLayerMap,
  path.join(tempRoot, "missing-layer-reference.cjs"),
);
record(
  missingLayer.status !== 0 &&
    missingLayer.stderr.includes("missing layer definition"),
  "missing layer reference fails closed",
  missingLayer.stderr || missingLayer.stdout,
);

const escapedMap = writeJson("escaped-values.json", {
  layers: [
    { name: "domain", path: "src/domain's" },
    { name: "infrastructure", path: 'src/"infra"' },
  ],
  forbidden: [
    {
      from: "domain",
      to: "infrastructure",
      reason: 'Domain\'s quoted reason must survive "generation"',
      seededViolation:
        'src/domain/__architecture__/domain-imports-"infra".seed.ts',
    },
  ],
});
const escapedOutput = path.join(tempRoot, "escaped-values.cjs");
const escaped = runGenerator(escapedMap, escapedOutput);
record(
  escaped.status === 0,
  "escaped values generate successfully",
  escaped.stderr || escaped.stdout,
);

if (escaped.status === 0) {
  try {
    const generated = require(escapedOutput);
    const [rule] = generated.forbidden;
    record(
      rule.comment.includes("Domain's quoted reason") &&
        rule.comment.includes('domain-imports-"infra".seed.ts') &&
        rule.from.path === "src/domain's" &&
        rule.to.path === 'src/"infra"',
      "generated JS preserves escaped reason, seed, and layer paths",
      JSON.stringify(rule, null, 2),
    );
  } catch (err) {
    record(false, "generated JS can be loaded", err.message);
  }
}

fs.rmSync(tempRoot, { recursive: true, force: true });

if (failures.length > 0) {
  console.error("\nGenerator smoke checks failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Generator smoke checks passed.");
