import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { afterEach, describe, expect, it } from "vitest";

const packageRoot = path.resolve(import.meta.dirname, "..");
const repoRoot = path.resolve(packageRoot, "../..");
const tempDirs = [];

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));

const writeJson = (filePath, value) => {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
};

const createFixtureRepo = () => {
  const tempDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "technical-design-eval-fixtures-"),
  );
  tempDirs.push(tempDir);

  for (const relativePath of [
    "docs/design/lessons-ledger.md",
    "methodologies/ddd/review-rubric.md",
    "skills/author-technical-design/SKILL.md",
  ]) {
    fs.cpSync(
      path.join(repoRoot, relativePath),
      path.join(tempDir, relativePath),
      {
        recursive: true,
      },
    );
  }

  for (const relativePath of [
    "fixtures/ddd",
    "fixtures/cases",
    "schemas",
    "fixtures/review/expected-suggestions.json",
    "src/validate_eval_fixtures.mjs",
    "src/lib",
  ]) {
    fs.cpSync(
      path.join(packageRoot, relativePath),
      path.join(tempDir, "internal/evals", relativePath),
      {
        recursive: true,
      },
    );
  }

  fs.symlinkSync(
    path.join(packageRoot, "node_modules"),
    path.join(tempDir, "internal/evals/node_modules"),
  );

  return tempDir;
};

const runValidator = (cwd) => {
  try {
    execFileSync(
      process.execPath,
      ["internal/evals/src/validate_eval_fixtures.mjs"],
      {
        cwd,
        encoding: "utf8",
        stdio: "pipe",
      },
    );
    return { ok: true, stdout: "", stderr: "" };
  } catch (error) {
    return {
      ok: false,
      stdout: error.stdout ?? "",
      stderr: error.stderr ?? "",
    };
  }
};

afterEach(() => {
  for (const tempDir of tempDirs.splice(0)) {
    fs.rmSync(tempDir, { force: true, recursive: true });
  }
});

describe("validate_eval_fixtures", () => {
  it("fails when an initial required defect is missing", () => {
    const fixtureRepo = createFixtureRepo();
    const manifestPath = path.join(
      fixtureRepo,
      "internal/evals/fixtures/ddd/defect-manifest.json",
    );
    const manifest = readJson(manifestPath);

    manifest.defects = manifest.defects.filter(
      (defect) => defect.id !== "invented-failure-token",
    );
    writeJson(manifestPath, manifest);

    const result = runValidator(fixtureRepo);
    expect(result.ok).toBe(false);
    expect(result.stderr).toContain(
      "defect manifest must include invented-failure-token",
    );
  });

  it("fails when a rubric reference is blank", () => {
    const fixtureRepo = createFixtureRepo();
    const expectedSuggestionsPath = path.join(
      fixtureRepo,
      "internal/evals/fixtures/review/expected-suggestions.json",
    );
    const suggestions = readJson(expectedSuggestionsPath);

    suggestions[0].gate_ref = "DDD review rubric: ";
    writeJson(expectedSuggestionsPath, suggestions);

    const result = runValidator(fixtureRepo);
    expect(result.ok).toBe(false);
    expect(result.stderr).toContain(
      "expected-suggestions[0].gate_ref must cite rubric text",
    );
  });

  it("fails when required strings contain only whitespace", () => {
    const fixtureRepo = createFixtureRepo();
    const expectedSuggestionsPath = path.join(
      fixtureRepo,
      "internal/evals/fixtures/review/expected-suggestions.json",
    );
    const suggestions = readJson(expectedSuggestionsPath);

    suggestions[0].title = "   ";
    writeJson(expectedSuggestionsPath, suggestions);

    const result = runValidator(fixtureRepo);
    expect(result.ok).toBe(false);
    expect(result.stderr).toContain(
      "expected-suggestions[0].title must not be blank",
    );
  });

  it("fails when expected suggestion severity disagrees with the rubric section", () => {
    const fixtureRepo = createFixtureRepo();
    const expectedSuggestionsPath = path.join(
      fixtureRepo,
      "internal/evals/fixtures/review/expected-suggestions.json",
    );
    const suggestions = readJson(expectedSuggestionsPath);

    suggestions[0].severity = "recommended";
    writeJson(expectedSuggestionsPath, suggestions);

    const result = runValidator(fixtureRepo);
    expect(result.ok).toBe(false);
    expect(result.stderr).toContain(
      "expected-suggestions[0].severity must match",
    );
  });

  it("fails when a lesson reference is unknown", () => {
    const fixtureRepo = createFixtureRepo();
    const expectedSuggestionsPath = path.join(
      fixtureRepo,
      "internal/evals/fixtures/review/expected-suggestions.json",
    );
    const suggestions = readJson(expectedSuggestionsPath);

    suggestions[0].lesson_ref = "LSN-999";
    writeJson(expectedSuggestionsPath, suggestions);

    const result = runValidator(fixtureRepo);
    expect(result.ok).toBe(false);
    expect(result.stderr).toContain(
      "expected-suggestions[0].lesson_ref references unknown lesson LSN-999",
    );
  });

  it("fails when a defect fixture path escapes fixtures/ddd", () => {
    const fixtureRepo = createFixtureRepo();
    const manifestPath = path.join(
      fixtureRepo,
      "internal/evals/fixtures/ddd/defect-manifest.json",
    );
    const manifest = readJson(manifestPath);

    manifest.defects[0].file = "../review/expected-suggestions.json";
    writeJson(manifestPath, manifest);

    const result = runValidator(fixtureRepo);
    expect(result.ok).toBe(false);
    expect(result.stderr).toContain(
      "../review/expected-suggestions.json escapes fixtures/ddd",
    );
  });

  it("fails when the author skill omits required input resolution", () => {
    const fixtureRepo = createFixtureRepo();
    const skillPath = path.join(
      fixtureRepo,
      "skills/author-technical-design/SKILL.md",
    );
    const skillText = fs.readFileSync(skillPath, "utf8");

    fs.writeFileSync(
      skillPath,
      skillText.replace("## Step 2 - Resolve required inputs", "## Step 2"),
    );

    const result = runValidator(fixtureRepo);
    expect(result.ok).toBe(false);
    expect(result.stderr).toContain(
      "author skill must include required input resolution step",
    );
  });

  it("fails when the author skill omits source-named service candidate ownership coverage", () => {
    const fixtureRepo = createFixtureRepo();
    const skillPath = path.join(
      fixtureRepo,
      "skills/author-technical-design/SKILL.md",
    );
    const skillText = fs.readFileSync(skillPath, "utf8");

    fs.writeFileSync(
      skillPath,
      skillText
        .replace("source-named aggregate", "named aggregate")
        .replaceAll("service candidate", "named service"),
    );

    const result = runValidator(fixtureRepo);
    expect(result.ok).toBe(false);
    expect(result.stderr).toContain(
      'author skill required input resolution must mention "source-named aggregate"',
    );
    expect(result.stderr).toContain(
      'author skill required input resolution must mention "service candidate"',
    );
  });

  it("fails when a case fixture cites a source ref that is not visible in product.md or source-map.md", () => {
    const fixtureRepo = createFixtureRepo();
    const expectedFactsPath = path.join(
      fixtureRepo,
      "internal/evals/fixtures/cases/case-aerial-delivery-shipping-v1/expected-facts.json",
    );
    const expectedFacts = readJson(expectedFactsPath);

    expectedFacts.facts[0].source_refs = ["SRC-999"];
    writeJson(expectedFactsPath, expectedFacts);

    const result = runValidator(fixtureRepo);
    expect(result.ok).toBe(false);
    expect(result.stderr).toContain(
      "expected-facts.json facts[0].source_refs includes SRC-999, which is not present in product.md or source-map.md",
    );
  });

  it("fails when expected alternatives label reference-anchor wording", () => {
    const fixtureRepo = createFixtureRepo();
    const expectedFactsPath = path.join(
      fixtureRepo,
      "internal/evals/fixtures/cases/case-aerial-delivery-shipping-v1/expected-facts.json",
    );
    const expectedFacts = readJson(expectedFactsPath);

    expectedFacts.facts[0].accepted_alternatives = [
      {
        label: "Reference anchor wording",
        must_include_all: ["users request pickups"],
      },
    ];
    writeJson(expectedFactsPath, expectedFacts);

    const result = runValidator(fixtureRepo);
    expect(result.ok).toBe(false);
    expect(result.stderr).toContain(
      "expected-facts.json facts[0].accepted_alternatives[0].label must not cite reference-anchor wording",
    );
  });
});
