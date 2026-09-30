import { describe, expect, it } from "vitest";
import {
  extractCodeBlocks,
  filterCommands,
  formatActivityTime,
  isChatBusy,
  quotaPercent,
  toInitialMessages,
  workspaceCommands,
} from "@/lib/ui/workspace";

describe("filterCommands", () => {
  it("returns every destination when the query is blank", () => {
    expect(filterCommands("   ")).toEqual(workspaceCommands);
  });

  it("matches labels and hints without case", () => {
    expect(filterCommands("PLAN").map((item) => item.href)).toEqual(["/dashboard", "/settings"]);
    expect(filterCommands("chat").map((item) => item.href)).toEqual(["/ai"]);
  });

  it("returns nothing when nothing matches", () => {
    expect(filterCommands("zzz")).toEqual([]);
  });
});

describe("quotaPercent", () => {
  it("clamps usage into a 0-100 meter", () => {
    expect(quotaPercent(0, 100)).toBe(0);
    expect(quotaPercent(50, 100)).toBe(50);
    expect(quotaPercent(1, 3)).toBe(33);
    expect(quotaPercent(150, 100)).toBe(100);
    expect(quotaPercent(-5, 100)).toBe(0);
    expect(quotaPercent(10, 0)).toBe(0);
    expect(quotaPercent(Number.NaN, 10)).toBe(0);
  });
});

describe("formatActivityTime", () => {
  it("formats timestamps in UTC", () => {
    expect(formatActivityTime("2026-03-04T15:07:00.000Z")).toBe("Mar 4, 3:07 PM");
  });

  it("returns a dash for invalid dates", () => {
    expect(formatActivityTime("not-a-date")).toBe("—");
  });
});

describe("toInitialMessages", () => {
  it("keeps user and assistant turns in order", () => {
    expect(
      toInitialMessages([
        { id: "1", role: "system", content: "hidden" },
        { id: "2", role: "user", content: "Hi" },
        { id: "3", role: "assistant", content: "Hello" },
      ]),
    ).toEqual([
      { id: "2", role: "user", parts: [{ type: "text", text: "Hi" }] },
      { id: "3", role: "assistant", parts: [{ type: "text", text: "Hello" }] },
    ]);
  });
});

describe("extractCodeBlocks", () => {
  it("reads fenced blocks and skips empty or unclosed fences", () => {
    const text = ["Intro", "```ts", "const a = 1", "```", "```", "```", "```python", "print(1)", "```", "```js"].join(
      "\n",
    );

    expect(extractCodeBlocks(text)).toEqual([
      { language: "ts", code: "const a = 1" },
      { language: "python", code: "print(1)" },
    ]);
    expect(extractCodeBlocks("no fences")).toEqual([]);
    expect(extractCodeBlocks("```\nplain\n```")).toEqual([{ language: "text", code: "plain" }]);
  });
});

describe("isChatBusy", () => {
  it("is true only while a turn is in flight", () => {
    expect(isChatBusy("submitted")).toBe(true);
    expect(isChatBusy("streaming")).toBe(true);
    expect(isChatBusy("ready")).toBe(false);
    expect(isChatBusy("error")).toBe(false);
  });
});
