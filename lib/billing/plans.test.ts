import { describe, expect, it } from "vitest";
import { mapSubscriptionStatus, planFromPriceIds } from "@/lib/billing/plans";

describe("billing plans", () => {
  it("maps Stripe subscription statuses onto entitlement statuses", () => {
    expect(mapSubscriptionStatus("active")).toBe("active");
    expect(mapSubscriptionStatus("trialing")).toBe("trialing");
    expect(mapSubscriptionStatus("unpaid")).toBe("past_due");
    expect(mapSubscriptionStatus("incomplete_expired")).toBe("canceled");
    expect(mapSubscriptionStatus("paused")).toBe("canceled");
    expect(mapSubscriptionStatus("weird")).toBe("incomplete");
  });

  it("grants pro only when the configured price is present", () => {
    expect(planFromPriceIds(["price_pro"], "price_pro")).toBe("pro");
    expect(planFromPriceIds(["price_other"], "price_pro")).toBe("free");
  });
});
