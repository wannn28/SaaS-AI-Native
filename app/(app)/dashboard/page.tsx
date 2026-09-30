import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ensureAppUser } from "@/lib/auth/current-user";
import { getEntitlement, getMonthlyUsage, quotaLimitFor } from "@/lib/billing/entitlements";
import { captureException } from "@/lib/monitoring/sentry";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await ensureAppUser();
  let plan = "free";
  let status = "active";
  let used = 0;
  let limit = 0;
  let dbError: string | null = null;

  if (user) {
    try {
      const entitlement = await getEntitlement(user.id);
      plan = entitlement?.plan ?? "free";
      status = entitlement?.status ?? "active";
      const effectivePlan = status === "active" || status === "trialing" ? plan : "free";
      limit = quotaLimitFor(effectivePlan);
      used = await getMonthlyUsage(user.id);
    } catch (error) {
      dbError = "Database is unavailable. Start Postgres and run migrations.";
      captureException(error, { page: "dashboard" });
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {user?.email ?? "Signed in"} · access is read from the entitlements table.
        </p>
      </div>
      {dbError ? (
        <Card>
          <CardHeader>
            <CardTitle>Database</CardTitle>
            <CardDescription>{dbError}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Plan</CardDescription>
              <CardTitle className="capitalize">{plan}</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">{status}</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Tokens this month</CardDescription>
              <CardTitle>
                {used.toLocaleString()} / {limit.toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Workspace</CardDescription>
              <CardTitle>
                <Link href="/ai" className="text-primary">
                  Open AI
                </Link>
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}
    </div>
  );
}
