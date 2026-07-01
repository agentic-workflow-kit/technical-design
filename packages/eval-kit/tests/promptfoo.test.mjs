import { describe, expect, it } from "vitest";

import { extractPromptfooOutput, parseJsonOutput } from "../src/index.mjs";

describe("eval-kit promptfoo helpers", () => {
  it("extracts a single response output", () => {
    expect(
      extractPromptfooOutput({
        results: [{ response: { output: "candidate" } }],
      }),
    ).toBe("candidate");
  });

  it("extracts alternate response fields and nested promptfoo rows", () => {
    expect(
      extractPromptfooOutput({
        results: [{ response: { text: "candidate text" } }],
      }),
    ).toBe("candidate text");
    expect(
      extractPromptfooOutput({
        results: [{ response: { content: "candidate content" } }],
      }),
    ).toBe("candidate content");
    expect(
      extractPromptfooOutput({
        results: { results: [{ response: { output: "nested" } }] },
      }),
    ).toBe("nested");
  });

  it("serializes object outputs and fails closed on ambiguity", () => {
    expect(
      extractPromptfooOutput({
        results: [{ response: { output: { ok: true } } }],
      }),
    ).toBe(JSON.stringify({ ok: true }, null, 2));
    expect(() =>
      extractPromptfooOutput({
        results: [{ response: { output: "candidate", text: "other" } }],
      }),
    ).toThrow(/found 2 candidates/);
  });

  it("keeps legacy longest-string fallback explicit", () => {
    expect(
      extractPromptfooOutput(
        {
          results: [{ response: { output: "small" } }],
          nested: "# Much longer markdown output",
        },
        "legacy-longest-string",
      ),
    ).toBe("# Much longer markdown output");
  });

  it("parses fenced json output", () => {
    expect(parseJsonOutput('```json\n{"ok":true}\n```')).toEqual({
      ok: true,
    });
  });
});
