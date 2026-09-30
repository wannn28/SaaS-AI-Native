import Link from "next/link";
import { cn } from "cn";

export function Wordmark({ href, className }: { href?: string; className?: string }) {
  const mark = (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="flex size-6 items-center justify-center rounded-md bg-accent text-[10px] font-semibold tracking-tight text-accent-foreground">
        AI
      </span>
      <span className="text-sm font-semibold tracking-tight">SaaS AI</span>
    </span>
  );

  if (!href) return mark;

  return (
    <Link
      href={href}
      className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {mark}
    </Link>
  );
}
