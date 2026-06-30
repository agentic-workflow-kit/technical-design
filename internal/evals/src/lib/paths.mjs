import path from "node:path";
import { fileURLToPath } from "node:url";

const thisFile = fileURLToPath(import.meta.url);

export const packageRoot = path.resolve(path.dirname(thisFile), "../..");
export const repoRoot = path.resolve(packageRoot, "../..");
export const fixturesRoot = path.join(packageRoot, "fixtures");
export const schemasRoot = path.join(packageRoot, "schemas");
export const resultsRoot = path.join(packageRoot, "results");
export const promptfooRoot = path.join(packageRoot, "promptfoo");

export const toPosixPath = (value) => value.split(path.sep).join("/");

export const relativeToRepo = (absolutePath) =>
  toPosixPath(path.relative(repoRoot, absolutePath));

export const relativeToPackage = (absolutePath) =>
  toPosixPath(path.relative(packageRoot, absolutePath));

export const containsPath = (basePath, childPath) => {
  const relativePath = path.relative(basePath, childPath);
  return (
    relativePath === "" ||
    (!relativePath.startsWith("..") && !path.isAbsolute(relativePath))
  );
};

export const assertContainedPath = (basePath, childPath, label) => {
  if (!containsPath(basePath, childPath)) {
    throw new Error(`${label} escapes ${relativeToRepo(basePath)}`);
  }
  return childPath;
};

export const assertSafeId = (value, label) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} is required`);
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value)) {
    throw new Error(`${label} must be an id, not a path: ${value}`);
  }
  return value;
};

export const resolveCaseDir = (caseId) => {
  const safeCaseId = assertSafeId(caseId, "case id");
  return assertContainedPath(
    path.join(fixturesRoot, "cases"),
    path.resolve(fixturesRoot, "cases", safeCaseId),
    `case id ${safeCaseId}`,
  );
};

export const resolveRunDir = (runId) => {
  const safeRunId = assertSafeId(runId, "run id");
  return assertContainedPath(
    resultsRoot,
    path.resolve(resultsRoot, safeRunId),
    `run id ${safeRunId}`,
  );
};

export const resolveRepoInputPath = (inputPath, label) => {
  if (typeof inputPath !== "string" || inputPath.trim().length === 0) {
    throw new Error(`${label} is required`);
  }
  const resolved = path.isAbsolute(inputPath)
    ? path.resolve(inputPath)
    : path.resolve(repoRoot, inputPath);
  return assertContainedPath(repoRoot, resolved, label);
};

export const resolvePackagePath = (relativePath) =>
  path.resolve(packageRoot, relativePath);

export const resolveRepoPath = (relativePath) =>
  path.resolve(repoRoot, relativePath);
