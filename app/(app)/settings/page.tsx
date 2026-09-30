import Link from "next/link";
import { UserRound } from "lucide-react";
import { BillingActions } from "@/app/(app)/settings/billing-actions";
import { DataAlert } from "@/components/data-alert";
import { EmptyState } from "@/components/empty-state";
import { QuotaMeter } from "@/components/quota-meter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ensureAppUser } from "@/lib/auth/current-user";
import { getEntitlement, getMonthlyUsage, quotaLimitFor } from "@/lib/billing/entitlements";
import { captureException } from "@/lib/monitoring/sentry";
import { formatActivityTime } from "@/lib/ui/workspace";

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
  let used = 0;
  let limit = 0;
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
      const effectivePlan = status === "active" || status === "trialing" ? plan : "free";
      limit = quotaLimitFor(effectivePlan);
      used = await getMonthlyUsage(user.id);
    } catch (error) {
      dbError = "Database is unavailable. Start Postgres and run migrations.";
      captureException(error, { page: "settings" });
    }
  }

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Profile and billing for {user?.email ?? "this account"}.
        </p>
      </div>
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          {user?.email ? (
            <Card>
              <CardHeader>
                <CardDescription>Account</CardDescription>
                <CardTitle>{user.email}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Member since {formatActivityTime(user.createdAt)} UTC.</p>
                <p>Use the account menu in the header to manage the Clerk profile.</p>
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              icon={UserRound}
              title="No email on file"
              description="This account does not have an email address yet."
              action={
                <Button nativeButton={false} variant="secondary" render={<Link href="/dashboard" />}>
                  Back to dashboard
                </Button>
              }
            />
          )}
        </TabsContent>
        <TabsContent value="plan" className="flex flex-col gap-4">
          {billing === "success" ? (
            <Alert>
              <AlertTitle>Checkout returned</AlertTitle>
              <AlertDescription>The webhook updates the plan after Stripe confirms it.</AlertDescription>
            </Alert>
          ) : null}
          {billing === "canceled" ? (
            <Alert>
              <AlertTitle>Checkout canceled</AlertTitle>
              <AlertDescription>The current plan is unchanged.</AlertDescription>
            </Alert>
          ) : null}
          {dbError ? (
            <DataAlert message={dbError} />
          ) : (
            <Card>
              <CardHeader>
                <CardDescription>Current entitlement</CardDescription>
                <CardTitle className="flex items-center gap-2 capitalize">
                  {plan}
                  <Badge variant="secondary">{status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <QuotaMeter used={used} limit={limit} />
                <p className="text-sm text-muted-foreground">
                  {periodEnd
                    ? `Current period ends ${formatActivityTime(periodEnd)} UTC.`
                    : "No paid period is recorded yet."}
                </p>
                <BillingActions hasCustomer={hasCustomer} />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
