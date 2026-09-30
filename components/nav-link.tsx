"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

export function NavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-9 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground transition-colors outline-none hover:bg-elevated hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
        active && "bg-elevated text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
