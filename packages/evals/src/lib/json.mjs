import Ajv2020 from "ajv/dist/2020.js";
import fs from "node:fs";
import path from "node:path";

import { schemasRoot } from "./paths.mjs";

export const readText = (filePath) => fs.readFileSync(filePath, "utf8");

export const readJson = (filePath) => JSON.parse(readText(filePath));

export const writeText = (filePath, value) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
};

export const writeJson = (filePath, value) => {
  writeText(filePath, `${JSON.stringify(value, null, 2)}\n`);
};

const loadAllSchemas = (ajv) => {
  for (const fileName of fs
    .readdirSync(schemasRoot)
    .filter((item) => item.endsWith(".schema.json"))
    .sort((a, b) => a.localeCompare(b))) {
    const schema = readJson(path.join(schemasRoot, fileName));
    if (schema.$id && !ajv.getSchema(schema.$id)) {
      ajv.addSchema(schema);
    }
  }
};

export const validateJsonWithSchema = (schemaFileName, data, label) => {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  loadAllSchemas(ajv);
  const schema = readJson(path.join(schemasRoot, schemaFileName));
  const validate = schema.$id ? ajv.getSchema(schema.$id) : ajv.compile(schema);
  if (!validate) {
    throw new Error(`${label} schema did not compile: ${schemaFileName}`);
  }
  if (validate(data)) {
    return data;
  }
  const details = (validate.errors ?? [])
    .map((error) => `${error.instancePath || "<root>"} ${error.message}`)
    .join("; ");
  throw new Error(`${label} failed schema validation: ${details}`);
};
