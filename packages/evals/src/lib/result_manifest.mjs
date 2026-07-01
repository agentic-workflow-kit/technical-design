import {
  artifactRecord,
  createSchemaRegistry,
  writeManifest,
} from "@agentic-workflow-kit/eval-kit";

import { resolveRepoPath } from "./paths.mjs";

export const evalKitSchemaRegistry = () =>
  createSchemaRegistry({
    schemaRoots: [resolveRepoPath("packages/eval-kit/schemas")],
  });

export const artifactFor = (runDir, role, fileName, mediaType) =>
  artifactRecord({
    role,
    path: fileName,
    runDir,
    mediaType,
    redactionStatus: role.startsWith("raw_") ? "raw-local" : "public-safe",
  });

export const writeEvalKitManifest = ({ runDir, manifest }) =>
  writeManifest({
    runDir,
    manifest,
    schemaRegistry: evalKitSchemaRegistry(),
  });
