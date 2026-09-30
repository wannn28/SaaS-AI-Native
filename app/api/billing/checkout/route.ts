import { eq } from "drizzle-orm";
import { entitlements } from "@/drizzle/schema";
import { ensureAppUser } from "@/lib/auth/current-user";
import { getEntitlement } from "@/lib/billing/entitlements";
import { getDb } from "@/lib/db/client";
import { getEnv } from "@/lib/env";
import { captureException } from "@/lib/monitoring/sentry";
import { getStripe } from "@/lib/stripe/client";

export const runtime = "nodejs";

export async function POST() {
  const user = await ensureAppUser();
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const env = getEnv();

  try {
    const entitlement = await getEntitlement(user.id);
    let customerId = entitlement?.stripeCustomerId ?? null;

    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: user.email ?? undefined,
        metadata: { userId: user.id, clerkUserId: user.clerkUserId },
      });
      customerId = customer.id;
      if (entitlement) {
        await getDb()
          .update(entitlements)
          .set({ stripeCustomerId: customerId, updatedAt: new Date() })
          .where(eq(entitlements.userId, user.id));
      } else {
        await getDb().insert(entitlements).values({
          userId: user.id,
          plan: "free",
          status: "active",
          stripeCustomerId: customerId,
        });
      }
    }

    const session = await getStripe().checkout.sessions.create(
      {
        mode: "subscription",
        customer: customerId,
        client_reference_id: user.id,
        line_items: [{ price: env.STRIPE_PRICE_PRO, quantity: 1 }],
        success_url: `${env.NEXT_PUBLIC_APP_URL}/settings?billing=success`,
        cancel_url: `${env.NEXT_PUBLIC_APP_URL}/settings?billing=canceled`,
        metadata: { userId: user.id, clerkUserId: user.clerkUserId },
        subscription_data: {
          metadata: { userId: user.id, clerkUserId: user.clerkUserId },
        },
      },
      { idempotencyKey: `checkout_${user.id}_${new Date().toISOString().slice(0, 16)}` },
    );

    if (!session.url) {
      return Response.json({ error: "checkout_unavailable" }, { status: 502 });
    }

    return Response.json({ url: session.url });
  } catch (error) {
    captureException(error, { route: "billing.checkout", userId: user.id });
    return Response.json({ error: "checkout_failed" }, { status: 502 });
  }
}
