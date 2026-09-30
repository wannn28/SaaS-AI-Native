import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BillingActions } from "@/app/(app)/settings/billing-actions";
import { ensureAppUser } from "@/lib/auth/current-user";
import { getEntitlement } from "@/lib/billing/entitlements";
import { captureException } from "@/lib/monitoring/sentry";

export const metadata = { title: "Settings" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string }>;
}) {
  const params = await searchParams;
  const billing = Array.isArray(params.billing) ? params.billing[0] : params.billing;
  const user = await ensureAppUser();
  let plan = "free";
  let status = "active";
  let periodEnd: Date | null = null;
  let hasCustomer = false;
  let dbError: string | null = null;

  if (user) {
    try {
      const entitlement = await getEntitlement(user.id);
      plan = entitlement?.plan ?? "free";
      status = entitlement?.status ?? "active";
      periodEnd = entitlement?.currentPeriodEnd ?? null;
      hasCustomer = Boolean(entitlement?.stripeCustomerId);
    } catch (error) {
      dbError = "Database is unavailable. Start Postgres and run migrations.";
      captureException(error, { page: "settings" });
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Billing state is stored on the entitlements row for {user?.email ?? "this account"}.
        </p>
      </div>
      {billing === "success" ? (
        <p className="text-sm text-primary">Checkout returned. The webhook updates the plan after Stripe confirms it.</p>
      ) : null}
      {billing === "canceled" ? (
        <p className="text-sm text-muted-foreground">Checkout was canceled. The current plan is unchanged.</p>
      ) : null}
      <Card>
        <CardHeader>
          <CardDescription>Current entitlement</CardDescription>
          <CardTitle className="flex items-center gap-2 capitalize">
            {plan}
            <Badge variant="secondary">{status}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {periodEnd
              ? `Current period ends ${periodEnd.toLocaleString()}.`
              : "No paid period is recorded yet."}
          </p>
          {dbError ? <p className="text-sm text-muted-foreground">{dbError}</p> : <BillingActions hasCustomer={hasCustomer} />}
        </CardContent>
      </Card>
    </div>
  );
}
