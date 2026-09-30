export const ENTITLEMENT_STATUSES = [
  "active",
  "trialing",
  "past_due",
  "canceled",
  "incomplete",
] as const;

export type EntitlementStatus = (typeof ENTITLEMENT_STATUSES)[number];
export type PlanId = "free" | "pro";

export function mapSubscriptionStatus(status: string): EntitlementStatus {
  if (status === "unpaid") return "past_due";
  if (status === "incomplete_expired" || status === "paused") return "canceled";
  if ((ENTITLEMENT_STATUSES as readonly string[]).includes(status)) {
    return status as EntitlementStatus;
  }
  return "incomplete";
}

export function planFromPriceIds(priceIds: string[], proPriceId: string): PlanId {
  return priceIds.includes(proPriceId) ? "pro" : "free";
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
