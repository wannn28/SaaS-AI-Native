import { describe, expect, it } from "vitest";
import { isQuotaExceeded, quotaForPlan, startOfUtcMonth, totalTokens } from "@/lib/ai/quota";

describe("quota", () => {
  const limits = { free: 50_000, pro: 2_000_000 };

  it("assigns the free allowance unless the plan is pro", () => {
    expect(quotaForPlan("free", limits)).toBe(50_000);
    expect(quotaForPlan("pro", limits)).toBe(2_000_000);
    expect(quotaForPlan("unknown", limits)).toBe(50_000);
  });

  it("treats the limit as a hard stop", () => {
    expect(isQuotaExceeded(49_999, 50_000)).toBe(false);
    expect(isQuotaExceeded(50_000, 50_000)).toBe(true);
  });

  it("sums provider token counts and anchors the period to UTC midnight", () => {
    expect(totalTokens(12, undefined)).toBe(12);
    expect(totalTokens(10, 5)).toBe(15);
    expect(startOfUtcMonth(new Date("2026-09-30T23:15:00.000Z")).toISOString()).toBe(
      "2026-09-01T00:00:00.000Z",
    );
  });
});
