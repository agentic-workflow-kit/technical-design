import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

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
  if (!fs.existsSync(promptfooBin)) {
    throw new Error(
      `promptfoo binary not found at ${promptfooBin}; run pnpm install --frozen-lockfile`,
    );
  }
  return execFileSync(promptfooBin, ["eval", "-c", configPath], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      PROMPTFOO_DISABLE_TELEMETRY: "1",
    },
  });
};

const knownOutputCandidates = (value) => [
  value?.results?.results?.[0]?.response?.output,
  value?.results?.results?.[0]?.response?.text,
  value?.results?.results?.[0]?.response?.content,
  value?.results?.[0]?.response?.output,
  value?.results?.[0]?.response?.text,
  value?.results?.[0]?.response?.content,
  value?.results?.[0]?.output,
  value?.results?.[0]?.response,
];

const collectStrings = (value, strings = []) => {
  if (typeof value === "string") {
    strings.push(value);
    return strings;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      collectStrings(item, strings);
    }
    return strings;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) {
      collectStrings(item, strings);
    }
  }
  return strings;
};

export const extractPromptfooOutput = (promptfooResults) => {
  for (const candidate of knownOutputCandidates(promptfooResults)) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
    if (candidate && typeof candidate === "object") {
      return JSON.stringify(candidate, null, 2);
    }
  }
  const strings = collectStrings(promptfooResults)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .sort((a, b) => b.length - a.length);
  const markdownCandidate =
    strings.find((item) => item.includes("#") || item.includes("```")) ??
    strings[0];
  if (!markdownCandidate) {
    throw new Error("Promptfoo results did not include a model output");
  }
  return markdownCandidate;
};

export const parseJsonOutput = (output) => {
  const trimmed = String(output ?? "").trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(withoutFence);
  } catch {
    const firstBrace = withoutFence.indexOf("{");
    const lastBrace = withoutFence.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(withoutFence.slice(firstBrace, lastBrace + 1));
    }
    throw new Error("model output was not valid JSON");
  }
};
