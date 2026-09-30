import Link from "next/link";
import { createAiSession } from "@/app/(app)/ai/actions";
import { AiWorkspace } from "@/app/(app)/ai/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ensureAppUser } from "@/lib/auth/current-user";
import { listSessions } from "@/lib/ai/sessions";
import { captureException } from "@/lib/monitoring/sentry";

export const metadata = { title: "AI workspace" };

export default async function AiPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const params = await searchParams;
  const sessionId = Array.isArray(params.session) ? params.session[0] : params.session;
  const user = await ensureAppUser();
  let sessions: Awaited<ReturnType<typeof listSessions>> = [];
  let dbError: string | null = null;

  if (user) {
    try {
      sessions = await listSessions(user.id);
    } catch (error) {
      dbError = "Database is unavailable. Start Postgres and run migrations.";
      captureException(error, { page: "ai" });
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI workspace</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sessions live in Postgres.</p>
        </div>
        <form action={createAiSession} className="flex flex-col gap-2">
          <Input name="title" placeholder="Session title" />
          <Button type="submit" variant="secondary">
            New session
          </Button>
        </form>
        {dbError ? <p className="text-sm text-muted-foreground">{dbError}</p> : null}
        <ul className="space-y-1">
          {sessions.map((session) => (
            <li key={session.id}>
              <Link
                href={`/ai?session=${session.id}`}
                className="block truncate rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-elevated hover:text-foreground"
              >
                {session.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <AiWorkspace sessionId={sessionId} />
    </div>
  );
}
