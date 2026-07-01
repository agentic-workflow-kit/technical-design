import path from "node:path";

export const toPosixPath = (value) => value.split(path.sep).join("/");

export const containsPath = (basePath, childPath) => {
  const relativePath = path.relative(basePath, childPath);
  return (
    relativePath === "" ||
    (!relativePath.startsWith("..") && !path.isAbsolute(relativePath))
  );
};

export const assertContainedPath = (basePath, childPath, label) => {
  if (!containsPath(basePath, childPath)) {
    throw new Error(`${label} escapes ${toPosixPath(basePath)}`);
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

const resolveConfiguredPath = ({
  configDir,
  value,
  label,
  allowAbsolute = false,
}) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} is required`);
  }
  if (path.isAbsolute(value) && !allowAbsolute) {
    throw new Error(`${label} must be relative to the config file`);
  }
  return path.resolve(configDir, value);
};

export const createPathResolver = ({
  repoRoot,
  suiteRoot,
  resultsRoot,
  configDir = repoRoot,
}) => {
  const resolvedRepoRoot = path.resolve(repoRoot);
  const resolvedSuiteRoot = resolveConfiguredPath({
    configDir,
    value: suiteRoot,
    label: "suite root",
    allowAbsolute: true,
  });
  const resolvedResultsRoot = resolveConfiguredPath({
    configDir,
    value: resultsRoot,
    label: "results root",
    allowAbsolute: true,
  });

  assertContainedPath(resolvedRepoRoot, resolvedSuiteRoot, "suite root");
  assertContainedPath(resolvedRepoRoot, resolvedResultsRoot, "results root");

  const relativeToRepo = (absolutePath) =>
    toPosixPath(path.relative(resolvedRepoRoot, absolutePath));
  const relativeToSuite = (absolutePath) =>
    toPosixPath(path.relative(resolvedSuiteRoot, absolutePath));
  const relativeToResults = (absolutePath) =>
    toPosixPath(path.relative(resolvedResultsRoot, absolutePath));

  const resolveRunDir = (runId) => {
    const safeRunId = assertSafeId(runId, "run id");
    return assertContainedPath(
      resolvedResultsRoot,
      path.resolve(resolvedResultsRoot, safeRunId),
      `run id ${safeRunId}`,
    );
  };

  const resolveResultArtifact = (runDir, relativePath, label) => {
    if (path.isAbsolute(relativePath)) {
      throw new Error(`${label} must be relative to the run directory`);
    }
    return assertContainedPath(
      runDir,
      path.resolve(runDir, relativePath),
      label,
    );
  };

  const resolveSuitePath = (relativePath, label = "suite path") => {
    if (path.isAbsolute(relativePath)) {
      throw new Error(`${label} must be relative to the suite root`);
    }
    return assertContainedPath(
      resolvedSuiteRoot,
      path.resolve(resolvedSuiteRoot, relativePath),
      label,
    );
  };

  const resolveRepoPath = (relativePath, label = "repo path") => {
    if (path.isAbsolute(relativePath)) {
      throw new Error(`${label} must be relative to the repository root`);
    }
    return assertContainedPath(
      resolvedRepoRoot,
      path.resolve(resolvedRepoRoot, relativePath),
      label,
    );
  };

  return {
    repoRoot: resolvedRepoRoot,
    suiteRoot: resolvedSuiteRoot,
    resultsRoot: resolvedResultsRoot,
    relativeToRepo,
    relativeToSuite,
    relativeToResults,
    resolveRunDir,
    resolveResultArtifact,
    resolveSuitePath,
    resolveRepoPath,
  };
};
