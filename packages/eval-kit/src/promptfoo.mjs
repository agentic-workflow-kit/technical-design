import { execFileSync } from "node:child_process";
import fs from "node:fs";

export const runPromptfooRaw = ({
  promptfooBin,
  cwd,
  configPath,
  env = {},
}) => {
  if (!fs.existsSync(promptfooBin)) {
    throw new Error(`promptfoo binary not found at ${promptfooBin}`);
  }
  return execFileSync(promptfooBin, ["eval", "-c", configPath], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      ...env,
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

export const extractPromptfooOutput = (promptfooResults, selector) => {
  if (!selector || selector === "known-output") {
    const matches = knownOutputCandidates(promptfooResults).filter(
      (candidate) =>
        (typeof candidate === "string" && candidate.trim()) ||
        (candidate && typeof candidate === "object"),
    );
    if (matches.length !== 1) {
      throw new Error(
        `Promptfoo output selector known-output found ${matches.length} candidates`,
      );
    }
    const [candidate] = matches;
    return typeof candidate === "string"
      ? candidate.trim()
      : JSON.stringify(candidate, null, 2);
  }
  if (selector === "legacy-longest-string") {
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
  }
  throw new Error(`unknown Promptfoo output selector: ${selector}`);
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
