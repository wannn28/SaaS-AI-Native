"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { filterCommands } from "@/lib/ui/workspace";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const items = useMemo(() => filterCommands(query), [query]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function close() {
    setOpen(false);
    setQuery("");
  }

  function go(href: string) {
    close();
    router.push(href);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open command menu"
        className="inline-flex h-8 items-center justify-center gap-2 rounded-md border border-border bg-surface px-2 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:px-2.5"
      >
        <Search className="size-3.5" />
        <span className="hidden md:inline">Search</span>
        <kbd className="hidden rounded border border-border bg-background px-1.5 font-mono text-[10px] leading-5 text-muted-foreground md:inline">
          ⌘K
        </kbd>
      </button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setQuery("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Jump to</DialogTitle>
            <DialogDescription>Navigate between Dashboard, AI, and Settings.</DialogDescription>
          </DialogHeader>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Dashboard, AI, Settings"
            aria-label="Filter commands"
            autoFocus
            onKeyDown={(event) => {
              const first = items[0];
              if (event.key === "Enter" && first) {
                event.preventDefault();
                go(first.href);
              }
            }}
          />
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <p className="text-sm text-muted-foreground">No matching commands.</p>
              <Button type="button" size="sm" variant="secondary" onClick={() => setQuery("")}>
                Clear search
              </Button>
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {items.map((item) => (
                <li key={item.href}>
                  <button
                    type="button"
                    onClick={() => go(item.href)}
                    className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm outline-none hover:bg-elevated focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <span>{item.label}</span>
                    <span className="text-xs text-muted-foreground">{item.hint}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
