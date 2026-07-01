import Ajv2020 from "ajv/dist/2020.js";
import fs from "node:fs";
import path from "node:path";

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));

const schemaFilesIn = (schemaRoot) =>
  fs
    .readdirSync(schemaRoot)
    .filter((fileName) => fileName.endsWith(".schema.json"))
    .sort((a, b) => a.localeCompare(b))
    .map((fileName) => path.join(schemaRoot, fileName));

export const createSchemaRegistry = ({ schemaRoots }) => {
  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    loadSchema: undefined,
  });
  const schemasByFileName = new Map();
  const seenIds = new Map();

  for (const schemaRoot of schemaRoots.map((root) => path.resolve(root))) {
    for (const schemaFile of schemaFilesIn(schemaRoot)) {
      const schema = readJson(schemaFile);
      if (typeof schema.$id === "string") {
        if (seenIds.has(schema.$id)) {
          throw new Error(
            `duplicate schema $id ${schema.$id} in ${schemaFile} and ${seenIds.get(schema.$id)}`,
          );
        }
        seenIds.set(schema.$id, schemaFile);
        ajv.addSchema(schema);
      }
      schemasByFileName.set(path.basename(schemaFile), {
        schema,
        schemaFile,
      });
    }
  }

  const compileByFileName = (schemaFileName) => {
    const record = schemasByFileName.get(schemaFileName);
    if (!record) {
      throw new Error(`schema not found: ${schemaFileName}`);
    }
    if (record.schema.$id) {
      const validate = ajv.getSchema(record.schema.$id);
      if (!validate) {
        throw new Error(`schema did not compile: ${schemaFileName}`);
      }
      return validate;
    }
    return ajv.compile(record.schema);
  };

  const validateWithSchema = (schemaIdOrFile, data, label) => {
    const validate = schemaIdOrFile.endsWith(".schema.json")
      ? compileByFileName(schemaIdOrFile)
      : ajv.getSchema(schemaIdOrFile);
    if (!validate) {
      throw new Error(`${label} schema did not compile: ${schemaIdOrFile}`);
    }
    if (validate(data)) {
      return data;
    }
    const details = (validate.errors ?? [])
      .map((error) => `${error.instancePath || "<root>"} ${error.message}`)
      .join("; ");
    throw new Error(`${label} failed schema validation: ${details}`);
  };

  return {
    ajv,
    validateWithSchema,
    schemaIds: [...seenIds.keys()],
  };
};

export const validateWithSchema = ({
  schemaRoots,
  schemaIdOrFile,
  data,
  label,
}) =>
  createSchemaRegistry({ schemaRoots }).validateWithSchema(
    schemaIdOrFile,
    data,
    label,
  );
