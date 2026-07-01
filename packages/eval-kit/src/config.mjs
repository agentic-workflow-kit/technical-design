import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { createPathResolver } from "./paths.mjs";
import { createSchemaRegistry } from "./schema.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultSchemasRoot = path.resolve(__dirname, "../schemas");
const defaultPromptsRoot = path.resolve(__dirname, "../promptfoo");

export const loadConfig = (configFilePath) => {
  const absoluteConfigPath = path.resolve(configFilePath);
  if (!fs.existsSync(absoluteConfigPath)) {
    throw new Error(`config file not found: ${configFilePath}`);
  }

  const rawConfig = JSON.parse(fs.readFileSync(absoluteConfigPath, "utf8"));

  // Create a minimal registry to validate the config itself
  const tempRegistry = createSchemaRegistry({
    schemaRoots: [defaultSchemasRoot],
  });
  const config = tempRegistry.validateWithSchema(
    "eval-kit.config.schema.json",
    rawConfig,
    "eval-kit config",
  );

  const configDir = path.dirname(absoluteConfigPath);

  // We need to determine the repo root. Let's find the closest .git or package.json up the tree.
  let repoRoot = configDir;
  while (repoRoot !== path.dirname(repoRoot)) {
    if (fs.existsSync(path.join(repoRoot, ".git"))) {
      break;
    }
    repoRoot = path.dirname(repoRoot);
  }

  const pathResolver = createPathResolver({
    repoRoot,
    suiteRoot: config.suite_root,
    resultsRoot: config.results_root,
    configDir,
  });

  // Resolve schema roots
  const canonicalRoots = (config.schema_roots ?? []).map((root) => {
    const abs = path.resolve(configDir, root);
    return fs.existsSync(abs) ? fs.realpathSync(abs) : abs;
  });
  const canonicalDefault = fs.existsSync(defaultSchemasRoot)
    ? fs.realpathSync(defaultSchemasRoot)
    : defaultSchemasRoot;

  const schemaRoots = Array.from(
    new Set([canonicalDefault, ...canonicalRoots]),
  );

  const schemaRegistry = createSchemaRegistry({ schemaRoots });

  // Expose helper to load dynamic adapters (graders, reporters, hooks)
  const loadModule = async (relativeOrAbsolutePath, label) => {
    const resolvedPath = path.isAbsolute(relativeOrAbsolutePath)
      ? relativeOrAbsolutePath
      : path.resolve(pathResolver.suiteRoot, relativeOrAbsolutePath);

    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`${label} file does not exist: ${resolvedPath}`);
    }

    try {
      const fileUrl = pathToFileURL(resolvedPath).href;
      return await import(fileUrl);
    } catch (error) {
      throw new Error(
        `failed to load ${label} module from ${resolvedPath}: ${error.message}`,
      );
    }
  };

  /**
   * Resolve a prompt template path. If the consumer specifies a path in
   * config.prompt_templates, resolve it relative to the suite root. Otherwise
   * fall back to the kit-bundled prompt in packages/eval-kit/promptfoo/.
   *
   * @param {"generation"|"pointwise_judge"|"pairwise_judge"} key - template key
   * @param {string} kitFallbackRelative - path relative to packages/eval-kit/promptfoo/
   * @returns {string} absolute path to the prompt template file
   */
  const resolvePromptTemplate = (key, kitFallbackRelative) => {
    const consumerPath = config.prompt_templates?.[key];
    if (consumerPath) {
      return pathResolver.resolveSuitePath(
        consumerPath,
        `prompt_templates.${key}`,
      );
    }
    const fallbackPath = path.resolve(defaultPromptsRoot, kitFallbackRelative);
    if (!fs.existsSync(fallbackPath)) {
      throw new Error(
        `Kit-bundled prompt template not found: ${fallbackPath}. Specify prompt_templates.${key} in your eval-kit.config.json.`,
      );
    }
    return fallbackPath;
  };

  const resolveKitSchemaPath = (schemaFileName) => {
    if (path.isAbsolute(schemaFileName) || schemaFileName.includes(path.sep)) {
      throw new Error(`schema file name must not be a path: ${schemaFileName}`);
    }
    const schemaPath = path.resolve(defaultSchemasRoot, schemaFileName);
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Kit-bundled schema not found: ${schemaPath}`);
    }
    return schemaPath;
  };

  return {
    raw: config,
    configDir,
    pathResolver,
    schemaRegistry,
    loadModule,
    resolvePromptTemplate,
    resolveKitSchemaPath,
  };
};
