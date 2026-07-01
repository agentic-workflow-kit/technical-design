import path from "node:path";

import {
  extractPromptfooOutput,
  parseJsonOutput,
  runPromptfooRaw,
} from "@agentic-workflow-kit/eval-kit";

import { packageRoot, repoRoot } from "./paths.mjs";

export const normalizeCodexProvider = (provider) => {
  if (!provider || provider === "openai") {
    return "openai:codex-app-server";
  }
  if (
    provider === "openai:codex-app-server" ||
    provider.startsWith("openai:codex-app-server:")
  ) {
    return provider;
  }
  throw new Error(
    `unsupported provider ${provider}; use openai or openai:codex-app-server`,
  );
};

export const codexProviderId = ({ provider, model }) => {
  const normalized = normalizeCodexProvider(provider);
  if (normalized.startsWith("openai:codex-app-server:")) {
    return normalized;
  }
  return `${normalized}:${model}`;
};

export const runPromptfoo = (configPath) => {
  const promptfooBin = path.join(packageRoot, "node_modules/.bin/promptfoo");
  return runPromptfooRaw({
    promptfooBin,
    cwd: repoRoot,
    env: {
      PROMPTFOO_DISABLE_TELEMETRY: "1",
    },
    configPath,
  });
};

export { extractPromptfooOutput, parseJsonOutput, runPromptfooRaw };
