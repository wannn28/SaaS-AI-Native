import { and, eq, gte, sql } from "drizzle-orm";
import { entitlements, usageEvents, type Entitlement } from "@/drizzle/schema";
import { quotaForPlan, startOfUtcMonth } from "@/lib/ai/quota";
import { getEnv } from "@/lib/env";
import { getDb } from "@/lib/db/client";
import { isUuid, planFromPriceIds, type EntitlementStatus, type PlanId } from "@/lib/billing/plans";

export async function getEntitlement(userId: string): Promise<Entitlement | null> {
  const [row] = await getDb()
    .select()
    .from(entitlements)
    .where(eq(entitlements.userId, userId))
    .limit(1);
  return row ?? null;
}

export async function getMonthlyUsage(userId: string, now = new Date()): Promise<number> {
  const [row] = await getDb()
    .select({
      total: sql<string>`coalesce(sum(${usageEvents.tokens}), 0)`,
    })
    .from(usageEvents)
    .where(
      and(
        eq(usageEvents.userId, userId),
        eq(usageEvents.kind, "chat"),
        gte(usageEvents.createdAt, startOfUtcMonth(now)),
      ),
    );

  return Number(row?.total ?? 0);
}

export function quotaLimitFor(plan: string): number {
  const env = getEnv();
  return quotaForPlan(plan, {
    free: env.AI_QUOTA_FREE_TOKENS,
    pro: env.AI_QUOTA_PRO_TOKENS,
  });
}

export async function upsertEntitlement(input: {
  userId: string;
  plan: PlanId;
  status: EntitlementStatus;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  currentPeriodEnd?: Date | null;
}): Promise<void> {
  if (!isUuid(input.userId)) return;

  const db = getDb();
  const existing = await getEntitlement(input.userId);
  const values = {
    plan: input.plan,
    status: input.status,
    stripeCustomerId: input.stripeCustomerId ?? existing?.stripeCustomerId ?? null,
    stripeSubscriptionId: input.stripeSubscriptionId ?? existing?.stripeSubscriptionId ?? null,
    currentPeriodEnd: input.currentPeriodEnd ?? existing?.currentPeriodEnd ?? null,
    updatedAt: new Date(),
  };

  if (!existing) {
    await db.insert(entitlements).values({ userId: input.userId, ...values });
    return;
  }

  await db.update(entitlements).set(values).where(eq(entitlements.userId, input.userId));
}

export async function findUserIdForBilling(input: {
  userId?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
}): Promise<string | null> {
  const db = getDb();

  if (input.userId && isUuid(input.userId)) {
    const [row] = await db
      .select({ userId: entitlements.userId })
      .from(entitlements)
      .where(eq(entitlements.userId, input.userId))
      .limit(1);
    if (row) return row.userId;
  }

  if (input.subscriptionId) {
    const [row] = await db
      .select({ userId: entitlements.userId })
      .from(entitlements)
      .where(eq(entitlements.stripeSubscriptionId, input.subscriptionId))
      .limit(1);
    if (row) return row.userId;
  }

  if (input.customerId) {
    const [row] = await db
      .select({ userId: entitlements.userId })
      .from(entitlements)
      .where(eq(entitlements.stripeCustomerId, input.customerId))
      .limit(1);
    if (row) return row.userId;
  }

  return null;
}

export function planForSubscriptionPrices(priceIds: string[]): PlanId {
  return planFromPriceIds(priceIds, getEnv().STRIPE_PRICE_PRO);
}
