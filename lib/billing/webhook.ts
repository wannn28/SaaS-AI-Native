import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { stripeWebhookEvents } from "@/drizzle/schema";
import { findUserIdForBilling, planForSubscriptionPrices, upsertEntitlement } from "@/lib/billing/entitlements";
import { mapSubscriptionStatus } from "@/lib/billing/plans";
import { getDb } from "@/lib/db/client";
import { getEnv } from "@/lib/env";
import { captureException } from "@/lib/monitoring/sentry";
import { getStripe, stripeId } from "@/lib/stripe/client";

export async function handleStripeWebhook(
  payload: string,
  signature: string | null,
): Promise<{ status: number; body: Record<string, unknown> }> {
  if (!signature) {
    return { status: 400, body: { error: "missing_signature" } };
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, getEnv().STRIPE_WEBHOOK_SECRET);
  } catch {
    return { status: 400, body: { error: "invalid_signature" } };
  }

  const db = getDb();
  const claimed = await db
    .insert(stripeWebhookEvents)
    .values({ id: event.id, type: event.type, status: "processing" })
    .onConflictDoNothing({ target: stripeWebhookEvents.id })
    .returning({ id: stripeWebhookEvents.id });

  if (claimed.length === 0) {
    return { status: 200, body: { received: true, duplicate: true } };
  }

  try {
    await applyStripeEvent(event);
    await db
      .update(stripeWebhookEvents)
      .set({ status: "processed", processedAt: new Date() })
      .where(eq(stripeWebhookEvents.id, event.id));
    return { status: 200, body: { received: true } };
  } catch (error) {
    await db.delete(stripeWebhookEvents).where(eq(stripeWebhookEvents.id, event.id));
    captureException(error, { stripeEventId: event.id, type: event.type });
    return { status: 500, body: { error: "webhook_failed" } };
  }
}

async function applyStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      await applyCheckoutSession(event.data.object as Stripe.Checkout.Session);
      return;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await applySubscription(event.data.object as Stripe.Subscription);
      return;
    case "invoice.payment_failed":
      await applyFailedInvoice(event.data.object as Stripe.Invoice);
      return;
    default:
      return;
  }
}

async function applyCheckoutSession(session: Stripe.Checkout.Session): Promise<void> {
  if (session.mode && session.mode !== "subscription") return;

  const customerId = stripeId(session.customer);
  const subscriptionId = stripeId(session.subscription);
  const metadataUserId = session.metadata?.userId ?? session.client_reference_id;
  const subscription = subscriptionId
    ? await getStripe().subscriptions.retrieve(subscriptionId)
    : null;

  await syncSubscription({
    userId: metadataUserId,
    customerId,
    subscription,
    fallbackSubscriptionId: subscriptionId,
  });
}

async function applySubscription(subscription: Stripe.Subscription): Promise<void> {
  await syncSubscription({
    userId: subscription.metadata?.userId,
    customerId: stripeId(subscription.customer),
    subscription,
  });
}

async function applyFailedInvoice(invoice: Stripe.Invoice): Promise<void> {
  const customerId = stripeId(invoice.customer);
  const subscriptionId = subscriptionIdFromInvoice(invoice);
  const userId = await findUserIdForBilling({ customerId, subscriptionId });
  if (!userId) return;

  const existingSubscription = subscriptionId
    ? await getStripe().subscriptions.retrieve(subscriptionId)
    : null;

  await upsertEntitlement({
    userId,
    plan: existingSubscription ? planForSubscriptionPrices(priceIds(existingSubscription)) : "free",
    status: "past_due",
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    currentPeriodEnd: existingSubscription ? periodEnd(existingSubscription) : null,
  });
}

async function syncSubscription(input: {
  userId?: string | null;
  customerId: string | null;
  subscription: Stripe.Subscription | null;
  fallbackSubscriptionId?: string | null;
}): Promise<void> {
  const subscriptionId = input.subscription?.id ?? input.fallbackSubscriptionId ?? null;
  const userId = await findUserIdForBilling({
    userId: input.userId,
    customerId: input.customerId,
    subscriptionId,
  });
  if (!userId) return;

  const canceled = input.subscription?.status === "canceled";
  await upsertEntitlement({
    userId,
    plan: input.subscription && !canceled ? planForSubscriptionPrices(priceIds(input.subscription)) : "free",
    status: input.subscription ? mapSubscriptionStatus(input.subscription.status) : "active",
    stripeCustomerId: input.customerId ?? (input.subscription ? stripeId(input.subscription.customer) : null),
    stripeSubscriptionId: subscriptionId,
    currentPeriodEnd: input.subscription ? periodEnd(input.subscription) : null,
  });
}

function priceIds(subscription: Stripe.Subscription): string[] {
  return subscription.items.data.map((item) => item.price?.id).filter((id): id is string => Boolean(id));
}

function periodEnd(subscription: Stripe.Subscription): Date | null {
  const ends = subscription.items.data
    .map((item) => item.current_period_end)
    .filter((value): value is number => typeof value === "number");
  if (ends.length === 0) return null;
  return new Date(Math.max(...ends) * 1000);
}

function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const parent = invoice.parent;
  if (parent?.type === "subscription_details") {
    return stripeId(parent.subscription_details?.subscription);
  }
  return null;
}
