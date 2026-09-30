"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Wordmark } from "@/components/wordmark";
import { WorkspaceNav } from "@/components/workspace-nav";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="md:hidden"
        render={<Button variant="ghost" size="icon" aria-label="Open menu" />}
      >
        <Menu />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="bg-surface data-[side=left]:w-[240px]! data-[side=left]:max-w-[240px]!"
      >
        <SheetHeader className="border-b border-border">
          <SheetTitle>
            <Wordmark />
          </SheetTitle>
          <SheetDescription>Workspace navigation</SheetDescription>
        </SheetHeader>
        <WorkspaceNav className="px-3" onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
