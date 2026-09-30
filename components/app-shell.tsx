import { UserButton } from "@clerk/nextjs";
import { NavLink } from "@/components/nav-link";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/ai", label: "AI workspace" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-[240px] shrink-0 flex-col border-r border-border bg-surface md:flex">
        <div className="flex h-14 items-center px-4 text-sm font-semibold tracking-tight">
          SaaS AI
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
          {links.map((link) => (
            <NavLink key={link.href} href={link.href}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border px-4">
          <nav className="flex items-center gap-1 md:hidden">
            {links.map((link) => (
              <NavLink key={link.href} href={link.href}>
                {link.label}
              </NavLink>
            ))}
          </nav>
          <p className="hidden text-sm text-muted-foreground md:block">Workspace</p>
          <UserButton />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
