import { execFileSync, spawnSync } from "node:child_process";
import path from "node:path";

import { packageRoot, repoRoot } from "./paths.mjs";

export const commandString = () => process.argv.join(" ");

export const execText = (command, args, options = {}) =>
  execFileSync(command, args, {
    cwd: options.cwd ?? repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: options.env ?? process.env,
  }).trim();

export const gitCommit = () => execText("git", ["rev-parse", "HEAD"]);

export const toolVersions = () => {
  const versions = {
    node: process.version,
  };
  try {
    versions.pnpm = execText("pnpm", ["--version"]);
  } catch {
    versions.pnpm = "unavailable";
  }
  try {
    versions.codex = execText("codex", ["--version"]);
  } catch {
    versions.codex = "unavailable";
  }
  try {
    versions.promptfoo = execText(
      path.join(packageRoot, "node_modules/.bin/promptfoo"),
      ["--version"],
      { cwd: packageRoot },
    );
  } catch {
    versions.promptfoo = "unavailable";
  }
  return versions;
};

export const codexAuthMode = () => {
  const result = spawnSync("codex", ["login", "status"], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error(
      `Codex local auth is not ready. Run codex login before model-graded evals. ${result.stderr || result.error?.message || "unknown error"}`,
    );
  }
  const status = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  if (status.toLowerCase().includes("chatgpt")) {
    return "chatgpt-local";
  }
  return "local";
};
