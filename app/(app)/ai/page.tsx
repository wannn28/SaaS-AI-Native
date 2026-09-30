import Link from "next/link";
import { CircleAlert } from "lucide-react";
import { AiWorkspace } from "@/app/(app)/ai/workspace";
import { DataAlert } from "@/components/data-alert";
import { SessionList } from "@/components/session-list";
import { Button } from "@/components/ui/button";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ensureAppUser } from "@/lib/auth/current-user";
import { getOwnedSession, listSessionMessages, listSessions } from "@/lib/ai/sessions";
import { captureException } from "@/lib/monitoring/sentry";
import { formatActivityTime, toInitialMessages, type InitialChatMessage, type SessionListItem } from "@/lib/ui/workspace";

export const metadata = { title: "AI workspace" };

export default async function AiPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const params = await searchParams;
  const requestedId = Array.isArray(params.session) ? params.session[0] : params.session;
  const user = await ensureAppUser();
  let sessions: SessionListItem[] = [];
  let initialMessages: InitialChatMessage[] = [];
  let activeSessionId: string | undefined;
  let missingSession = false;
  let dbError: string | null = null;

  if (user) {
    try {
      const rows = await listSessions(user.id);
      sessions = rows.map((session) => ({
        id: session.id,
        title: session.title,
        updatedLabel: formatActivityTime(session.updatedAt),
      }));

      if (requestedId) {
        const owned = rows.find((session) => session.id === requestedId) ?? (await getOwnedSession(user.id, requestedId));
        if (!owned) {
          missingSession = true;
        } else {
          activeSessionId = owned.id;
          initialMessages = toInitialMessages(await listSessionMessages(owned.id));
        }
      }
    } catch (error) {
      dbError = "Database is unavailable. Start Postgres and run migrations.";
      captureException(error, { page: "ai" });
    }
  }

  return (
    <div className="flex min-h-[32rem] flex-1 flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI workspace</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sessions stay on this account.</p>
      </div>
      {dbError ? <DataAlert message={dbError} /> : null}
      {missingSession ? (
        <Alert>
          <CircleAlert />
          <AlertTitle>Session not found</AlertTitle>
          <AlertDescription>That session is not on this account.</AlertDescription>
          <AlertAction>
            <Button nativeButton={false} size="xs" variant="outline" render={<Link href="/ai" />}>
              Back to workspace
            </Button>
          </AlertAction>
        </Alert>
      ) : null}
      {dbError ? null : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-surface lg:flex-row">
          <aside className="flex h-72 w-full shrink-0 flex-col border-b border-border lg:h-auto lg:w-[240px] lg:border-r lg:border-b-0">
            <SessionList sessions={sessions} activeId={activeSessionId} />
          </aside>
          <AiWorkspace
            key={activeSessionId ?? "none"}
            sessionId={activeSessionId}
            initialMessages={initialMessages}
            hasSessions={sessions.length > 0}
          />
        </div>
      )}
    </div>
  );
}
