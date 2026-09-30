"use client";

import { LayoutDashboard, Settings, Sparkles } from "lucide-react";
import { cn } from "cn";
import { NavLink } from "@/components/nav-link";
import { workspaceCommands } from "@/lib/ui/workspace";

const icons = {
  "/dashboard": LayoutDashboard,
  "/ai": Sparkles,
  "/settings": Settings,
} as const;

export function WorkspaceNav({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      {workspaceCommands.map((item) => {
        const Icon = icons[item.href];
        return (
          <NavLink key={item.href} href={item.href} onClick={onNavigate}>
            <Icon aria-hidden className="size-4" />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
