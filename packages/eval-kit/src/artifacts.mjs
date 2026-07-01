import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const toPosixPath = (value) => value.split(path.sep).join("/");

export const sha256File = (filePath) =>
  createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");

export const artifactRecord = ({
  role,
  path: relativePath,
  runDir,
  mediaType,
  redactionStatus = "public-safe",
  encoding = "utf-8",
  legacy = false,
}) => {
  if (typeof role !== "string" || role.trim().length === 0) {
    throw new Error("artifact role is required");
  }
  if (path.isAbsolute(relativePath)) {
    throw new Error(`artifact path must be relative: ${relativePath}`);
  }
  const absolutePath = path.resolve(runDir, relativePath);
  const contained =
    path.relative(runDir, absolutePath) === "" ||
    (!path.relative(runDir, absolutePath).startsWith("..") &&
      !path.isAbsolute(path.relative(runDir, absolutePath)));
  if (!contained) {
    throw new Error(`artifact path escapes run directory: ${relativePath}`);
  }
  const exists = fs.existsSync(absolutePath);
  if (!legacy && !exists) {
    throw new Error(`artifact does not exist: ${relativePath}`);
  }
  const stat = exists ? fs.statSync(absolutePath) : null;
  return {
    role,
    path: toPosixPath(relativePath),
    sha256: exists ? sha256File(absolutePath) : null,
    size_bytes: stat?.size ?? 0,
    media_type: mediaType,
    encoding,
    redaction_status: legacy ? "legacy-unknown" : redactionStatus,
  };
};

export const normalizeLegacyManifest = (manifest, runDir) => {
  if (Array.isArray(manifest.artifacts)) {
    return manifest;
  }
  const outputFiles = Array.isArray(manifest.output_files)
    ? manifest.output_files
    : [];
  return {
    schema_version: "eval-kit.result-manifest.v2",
    run_id: manifest.run_id,
    run_type: manifest.run_type,
    runner: {
      id: `legacy-${manifest.run_type ?? "unknown"}`,
      version: "legacy",
    },
    case_ids: manifest.case_ids ?? [],
    started_at: manifest.started_at ?? new Date(0).toISOString(),
    ended_at: manifest.ended_at ?? new Date(0).toISOString(),
    duration_ms: manifest.duration_ms ?? 0,
    status: "completed",
    git: {
      commit: manifest.git_commit ?? manifest.git?.commit ?? "unknown",
    },
    command: manifest.command ?? "unknown",
    tool_versions: manifest.tool_versions ?? {},
    artifacts: outputFiles.map((fileName) =>
      artifactRecord({
        role: "legacy_output",
        path: fileName,
        runDir,
        mediaType: fileName.endsWith(".json")
          ? "application/json"
          : fileName.endsWith(".md")
            ? "text/markdown"
            : "application/octet-stream",
        legacy: !fs.existsSync(path.resolve(runDir, fileName)),
      }),
    ),
    output_files: outputFiles,
  };
};

export const writeManifest = ({ runDir, manifest, schemaRegistry }) => {
  const outputFiles = [
    "manifest.json",
    ...manifest.artifacts.map((artifact) => artifact.path),
  ];
  const normalized = {
    ...manifest,
    output_files: manifest.output_files ?? outputFiles,
  };
  schemaRegistry?.validateWithSchema?.(
    "result-manifest.v2.schema.json",
    normalized,
    "result manifest",
  );
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(
    path.join(runDir, "manifest.json"),
    `${JSON.stringify(normalized, null, 2)}\n`,
  );
  return normalized;
};

export const writeResultBundle = ({ runDir, manifest, schemaRegistry }) =>
  writeManifest({ runDir, manifest, schemaRegistry });
