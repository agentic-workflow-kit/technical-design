import { describe, expect, it } from "vitest";

import { aggregateVerdict, criticalBlockerCount } from "../src/index.mjs";

const policy = {
  blocking_severities: ["critical"],
  blocking_verdicts: ["missing", "contradicted", "invented"],
  non_green_verdicts: ["missing", "contradicted", "invented", "unknown"],
  red_verdict: "red",
  yellow_verdict: "yellow",
  green_verdict: "green",
};

describe("eval-kit verdict aggregation", () => {
  it("uses configurable blocker and non-green policy", () => {
    expect(
      aggregateVerdict([{ severity: "critical", verdict: "missing" }], policy),
    ).toBe("red");
    expect(
      aggregateVerdict(
        [{ severity: "recommended", verdict: "unknown" }],
        policy,
      ),
    ).toBe("yellow");
    expect(
      aggregateVerdict([{ severity: "critical", verdict: "covered" }], policy),
    ).toBe("green");
  });

  it("does not emit great for deterministic aggregation policy", () => {
    const verdict = aggregateVerdict(
      [{ severity: "critical", verdict: "covered" }],
      policy,
    );
    expect(verdict).not.toBe("great");
  });

  it("counts critical blockers", () => {
    expect(
      criticalBlockerCount(
        [
          { severity: "critical", verdict: "missing" },
          { severity: "recommended", verdict: "missing" },
        ],
        policy,
      ),
    ).toBe(1);
  });
});
