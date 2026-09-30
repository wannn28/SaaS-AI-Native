import Link from "next/link";
import { Inbox } from "lucide-react";
import { cn } from "cn";
import { createAiSession } from "@/app/(app)/ai/actions";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SessionListItem } from "@/lib/ui/workspace";

export function SessionList({
  sessions,
  activeId,
}: {
  sessions: SessionListItem[];
  activeId?: string;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className="border-b border-border p-3">
        {sessions.length === 0 ? (
          <p className="text-sm font-medium">Sessions</p>
        ) : (
          <form action={createAiSession} className="flex gap-2">
            <Input name="title" placeholder="Session title" aria-label="Session title" />
            <Button type="submit" variant="secondary" size="sm">
              New
            </Button>
          </form>
        )}
      </div>
      <ScrollArea className="h-0 min-h-0 flex-1">
        {sessions.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No sessions yet"
            description="Create a session to start a conversation."
            action={
              <form action={createAiSession}>
                <Button type="submit">New session</Button>
              </form>
            }
          />
        ) : (
          <ul className="flex flex-col gap-1 p-2">
            {sessions.map((session) => {
              const active = session.id === activeId;
              return (
                <li key={session.id}>
                  <Link
                    href={`/ai?session=${session.id}`}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block rounded-md px-3 py-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                      active
                        ? "bg-elevated text-foreground"
                        : "text-muted-foreground hover:bg-elevated hover:text-foreground",
                    )}
                  >
                    <span className="block truncate text-sm">{session.title}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">{session.updatedLabel} UTC</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </ScrollArea>
    </div>
  );
}
