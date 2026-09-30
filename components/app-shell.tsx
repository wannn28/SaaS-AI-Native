import { UserButton } from "@clerk/nextjs";
import { CommandMenu } from "@/components/command-menu";
import { MobileNav } from "@/components/mobile-nav";
import { Wordmark } from "@/components/wordmark";
import { WorkspaceNav } from "@/components/workspace-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <aside className="hidden w-[240px] shrink-0 flex-col border-r border-border bg-surface md:flex">
        <div className="flex h-14 items-center border-b border-border px-4">
          <Wordmark href="/dashboard" />
        </div>
        <WorkspaceNav className="flex-1 px-3 py-3" />
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
          <MobileNav />
          <p className="hidden text-sm text-muted-foreground sm:block">Workspace</p>
          <div className="ml-auto flex items-center gap-2">
            <CommandMenu />
            <UserButton />
          </div>
        </header>
        <main className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
