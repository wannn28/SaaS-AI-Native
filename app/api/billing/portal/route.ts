import { ensureAppUser } from "@/lib/auth/current-user";
import { getEntitlement } from "@/lib/billing/entitlements";
import { getEnv } from "@/lib/env";
import { captureException } from "@/lib/monitoring/sentry";
import { getStripe } from "@/lib/stripe/client";

export const runtime = "nodejs";

export async function POST() {
  const user = await ensureAppUser();
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const entitlement = await getEntitlement(user.id);
  if (!entitlement?.stripeCustomerId) {
    return Response.json({ error: "no_customer" }, { status: 409 });
  }

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: entitlement.stripeCustomerId,
      return_url: `${getEnv().NEXT_PUBLIC_APP_URL}/settings`,
    });

    if (!session.url) {
      return Response.json({ error: "portal_unavailable" }, { status: 502 });
    }

    return Response.json({ url: session.url });
  } catch (error) {
    captureException(error, { route: "billing.portal", userId: user.id });
    return Response.json({ error: "portal_failed" }, { status: 502 });
  }
}
