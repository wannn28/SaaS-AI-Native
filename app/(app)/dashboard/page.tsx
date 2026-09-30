import Link from "next/link";
import { Inbox } from "lucide-react";
import { DataAlert } from "@/components/data-alert";
import { EmptyState } from "@/components/empty-state";
import { QuotaMeter } from "@/components/quota-meter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ensureAppUser } from "@/lib/auth/current-user";
import { listSessions } from "@/lib/ai/sessions";
import { getEntitlement, getMonthlyUsage, quotaLimitFor } from "@/lib/billing/entitlements";
import { captureException } from "@/lib/monitoring/sentry";
import { formatActivityTime, type SessionListItem } from "@/lib/ui/workspace";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await ensureAppUser();
  let plan = "free";
  let status = "active";
  let used = 0;
  let limit = 0;
  let sessions: SessionListItem[] = [];
  let dbError: string | null = null;

  if (user) {
    try {
      const entitlement = await getEntitlement(user.id);
      plan = entitlement?.plan ?? "free";
      status = entitlement?.status ?? "active";
      const effectivePlan = status === "active" || status === "trialing" ? plan : "free";
      limit = quotaLimitFor(effectivePlan);
      const [usage, rows] = await Promise.all([getMonthlyUsage(user.id), listSessions(user.id)]);
      used = usage;
      sessions = rows.slice(0, 8).map((session) => ({
        id: session.id,
        title: session.title,
        updatedLabel: formatActivityTime(session.updatedAt),
      }));
    } catch (error) {
      dbError = "Database is unavailable. Start Postgres and run migrations.";
      captureException(error, { page: "dashboard" });
    }
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {user?.email ?? "Signed in"} · plan and usage come from the entitlements table.
        </p>
      </div>
      {dbError ? (
        <DataAlert message={dbError} />
      ) : (
        <>
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
                <CardDescription>Usage quota</CardDescription>
                <CardTitle className="font-mono tabular-nums">
                  {used.toLocaleString()} / {limit.toLocaleString()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QuotaMeter used={used} limit={limit} labelled={false} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Workspace</CardDescription>
                <CardTitle>AI</CardTitle>
              </CardHeader>
              <CardContent>
                <Button nativeButton={false} render={<Link href="/ai" />}>
                  Start in AI workspace
                </Button>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>Latest AI sessions. Times are UTC.</CardDescription>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title="No sessions yet"
                  description="Recent sessions will show up in this table."
                  action={
                    <Button nativeButton={false} render={<Link href="/ai" />}>
                      Start in AI workspace
                    </Button>
                  }
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Session</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="text-right">Open</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="max-w-[16rem] truncate font-medium">{session.title}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {session.updatedLabel}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/ai?session=${session.id}`}
                            className="text-sm text-accent outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                          >
                            Open
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
