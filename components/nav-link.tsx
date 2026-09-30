"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

export function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        "flex h-9 items-center rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground",
        active && "bg-elevated text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
