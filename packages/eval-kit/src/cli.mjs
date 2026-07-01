import path from "node:path";
import { parseArgs, requireArg, defaultRunId } from "./args.mjs";
import { loadConfig } from "./config.mjs";
import {
  runCase,
  generateCandidate,
  judgeCoverage,
  judgePairwise,
  compileReport,
  validateFixtures,
} from "./sdk.mjs";

const requireEnabledMethod = (config, methodKey, commandName) => {
  if (config.raw.methods?.[methodKey]?.enabled === false) {
    throw new Error(
      `${commandName} is disabled by methods.${methodKey}.enabled=false`,
    );
  }
};

const printHelp = () => {
  console.log(`
Usage: eval-kit <command> [options]

Commands:
  run-case          Grade a single case candidate deterministically
    --case <id>
    --candidate <path>
    [--run-id <id>]
    [--config <path>]

  generate          Generate a candidate design using Promptfoo
    --case <id>
    --model <name>
    --provider <name>
    --effort <low|medium|high>
    --run-id <id>
    [--config <path>]

  judge-coverage    Pointwise judge expected facts and boundaries coverage
    --case <id>
    --candidate <path>
    --model <name>
    --provider <name>
    --effort <low|medium|high>
    [--run-id <id>]
    [--config <path>]

  judge-pairwise    Pairwise compare two candidates
    --case <id>
    --candidate-a <path>
    --candidate-b <path>
    --model <name>
    --provider <name>
    --effort <low|medium|high>
    --seed <number>
    --run-id <id>
    [--config <path>]

  report            Compile manual reports into a unified summary
    --run-id <id>
    [--generate <id>]
    [--deterministic <id>]
    [--judge-coverage <id>]
    [--judge <id>]
    [--outcome <id>]
    [--config <path>]

  validate-fixtures Validate case manifests and expected fixtures
    [--config <path>]
`);
};

export const main = async () => {
  const subcommand = process.argv[2];
  if (!subcommand || subcommand === "--help" || subcommand === "-h") {
    printHelp();
    process.exit(1);
  }

  const rawArgs = process.argv.slice(3);
  let parsed;
  try {
    parsed = parseArgs(rawArgs);
  } catch (error) {
    console.error(`Error parsing arguments: ${error.message}`);
    process.exit(1);
  }

  const configPath = parsed.config ?? "eval-kit.config.json";
  let config;
  try {
    config = loadConfig(configPath);
  } catch (error) {
    console.error(`Error loading config: ${error.message}`);
    process.exit(1);
  }

  try {
    switch (subcommand) {
      case "run-case": {
        const caseId = requireArg(parsed, "case");
        const candidate = requireArg(parsed, "candidate");
        const runId = parsed["run-id"] ?? defaultRunId("deterministic");

        const result = await runCase({
          config,
          caseId,
          candidatePath: candidate,
          runId,
        });
        if (result.verdict === "red") {
          console.error("Deterministic grading failed (verdict red)");
          process.exit(1);
        }
        break;
      }

      case "generate": {
        const caseId = requireArg(parsed, "case");
        const model = requireArg(parsed, "model");
        const provider = requireArg(parsed, "provider");
        const effort = requireArg(parsed, "effort");
        const runId = requireArg(parsed, "run-id");

        await generateCandidate({
          config,
          caseId,
          model,
          provider,
          effort,
          runId,
        });
        break;
      }

      case "judge-coverage": {
        const caseId = requireArg(parsed, "case");
        const candidate = requireArg(parsed, "candidate");
        const model = requireArg(parsed, "model");
        const provider = requireArg(parsed, "provider");
        const effort = requireArg(parsed, "effort");
        const runId = parsed["run-id"] ?? defaultRunId("judge-coverage");

        await judgeCoverage({
          config,
          caseId,
          candidatePath: candidate,
          model,
          provider,
          effort,
          runId,
        });
        break;
      }

      case "judge-pairwise": {
        requireEnabledMethod(config, "judge_pairwise", "judge-pairwise");
        const caseId = requireArg(parsed, "case");
        const candidateA = requireArg(parsed, "candidate-a");
        const candidateB = requireArg(parsed, "candidate-b");
        const model = requireArg(parsed, "model");
        const provider = requireArg(parsed, "provider");
        const effort = requireArg(parsed, "effort");
        const seed = parseInt(requireArg(parsed, "seed"), 10);
        const runId = requireArg(parsed, "run-id");

        await judgePairwise({
          config,
          caseId,
          candidateAPath: candidateA,
          candidateBPath: candidateB,
          model,
          provider,
          effort,
          seed,
          runId,
        });
        break;
      }

      case "report": {
        const runId = requireArg(parsed, "run-id");
        const runs = {};
        if (parsed.generate) runs.generate = parsed.generate;
        if (parsed.deterministic) runs.deterministic = parsed.deterministic;
        if (parsed["judge-coverage"])
          runs["judge-coverage"] = parsed["judge-coverage"];
        if (parsed.judge) runs.judge = parsed.judge;
        if (parsed.outcome) runs.outcome = parsed.outcome;

        await compileReport({ config, runId, runs });
        break;
      }

      case "validate-fixtures": {
        await validateFixtures({ config });
        console.log("Fixtures validation completed successfully.");
        break;
      }

      default:
        console.error(`Unknown command: ${subcommand}`);
        printHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error(`Execution failed: ${error.message}`);
    process.exit(1);
  }
};
