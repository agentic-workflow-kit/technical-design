#!/usr/bin/env node
/**
 * generate_depcruise.mjs
 *
 * Generates a dependency-cruiser configuration from a layer-map.json.
 * Declared boundary rules must include seededViolation metadata so the
 * generated CI gate can be proven to fail for each rule.
 */

import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

const helpText = `
Usage: generate_depcruise.mjs <layer-map.json> [options]

Options:
  --help          Show this help message
  --output <file> Write output to <file> (defaults to .dependency-cruiser.js)
`;

let args;
try {
  args = parseArgs({
    args: process.argv.slice(2),
    options: {
      help: { type: "boolean" },
      output: { type: "string", short: "o" },
    },
    allowPositionals: true,
  });
} catch (err) {
  console.error(`Error parsing arguments: ${err.message}`);
  console.error(helpText);
  process.exit(1);
}

if (args.values.help) {
  console.log(helpText);
  process.exit(0);
}

const mapFile = args.positionals[0];
if (!mapFile) {
  console.error("Error: missing <layer-map.json> positional argument.");
  console.error(helpText);
  process.exit(1);
}

const outputPath = args.values.output || ".dependency-cruiser.js";

let layerMap;
try {
  const content = fs.readFileSync(mapFile, "utf8");
  layerMap = JSON.parse(content);
} catch (err) {
  console.error(`Error reading or parsing ${mapFile}: ${err.message}`);
  process.exit(1);
}

if (
  !layerMap.layers ||
  layerMap.layers.length === 0 ||
  !layerMap.forbidden ||
  layerMap.forbidden.length === 0
) {
  console.log(
    "Notice: No enforceable architectural boundaries declared. Generating a minimal config for an honest pass.",
  );

  const emptyConfig = `module.exports = {
  forbidden: []
};
`;
  fs.writeFileSync(outputPath, emptyConfig);
  console.log(`Wrote minimal config to ${outputPath}`);
  process.exit(0);
}

const unseededRules = layerMap.forbidden.filter(
  (rule) => !rule.seededViolation,
);
if (unseededRules.length > 0) {
  console.error(
    "Error: every forbidden rule must include seededViolation metadata.",
  );
  for (const rule of unseededRules) {
    console.error(`- missing seededViolation for ${rule.from} -> ${rule.to}`);
  }
  process.exit(1);
}

const layerByName = new Map(
  layerMap.layers.map((layer) => [layer.name, layer]),
);
const missingLayerErrors = [];

for (const [idx, rule] of layerMap.forbidden.entries()) {
  const missing = [];
  if (!layerByName.has(rule.from)) {
    missing.push(`from=${String(rule.from)}`);
  }
  if (!layerByName.has(rule.to)) {
    missing.push(`to=${String(rule.to)}`);
  }
  if (missing.length > 0) {
    missingLayerErrors.push(
      `- rule ${idx} has missing layer definition(s): ${missing.join(", ")}`,
    );
  }
}

if (missingLayerErrors.length > 0) {
  console.error(
    "Error: forbidden rules reference missing layer definition(s).",
  );
  for (const error of missingLayerErrors) {
    console.error(error);
  }
  process.exit(1);
}

const jsString = (value) => JSON.stringify(String(value));

const forbiddenRules = layerMap.forbidden.map((rule) => {
  const fromLayer = layerByName.get(rule.from);
  const toLayer = layerByName.get(rule.to);
  const reason =
    rule.reason ||
    `This design explicitly forbids ${rule.from} from depending on ${rule.to}`;
  const comment = `${reason} Seed: ${rule.seededViolation}`;

  return `    {
      name: ${jsString(`no-${rule.from}-to-${rule.to}`)},
      comment: ${jsString(comment)},
      severity: "error",
      from: { path: ${jsString(fromLayer.path)} },
      to: { path: ${jsString(toLayer.path)} }
    }`;
});

const configSource = `/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
${forbiddenRules.join(",\n")}
  ],
  options: {
    doNotFollow: {
      path: 'node_modules'
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.json'
    }
  }
};
`;

try {
  fs.writeFileSync(outputPath, configSource);
  console.log(
    `Successfully generated config with ${forbiddenRules.length} rules to ${outputPath}`,
  );
} catch (err) {
  console.error(`Error writing to ${outputPath}: ${err.message}`);
  process.exit(1);
}
