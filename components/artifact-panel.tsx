import { SquareCode } from "lucide-react";
import { extractCodeBlocks } from "@/lib/ui/workspace";

export function ArtifactBody({ text }: { text: string }) {
  const blocks = extractCodeBlocks(text);

  if (!text.trim()) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-4 py-8 text-center">
        <SquareCode className="size-8 text-muted-foreground" aria-hidden />
        <p className="text-sm font-medium">No artifact yet</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          The latest assistant reply and any code blocks show up here.
        </p>
      </div>
    );
  }

  if (blocks.length === 0) {
    return (
      <pre className="overflow-x-auto font-mono text-xs leading-relaxed whitespace-pre-wrap text-foreground">
        {text}
      </pre>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {blocks.map((block, index) => (
        <section key={`${block.language}-${index}`} className="overflow-hidden rounded-md border border-border bg-background">
          <p className="border-b border-border px-3 py-1.5 font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
            {block.language}
          </p>
          <pre className="overflow-x-auto p-3 font-mono text-xs leading-relaxed whitespace-pre">
            <code>{block.code}</code>
          </pre>
        </section>
      ))}
    </div>
  );
}

export function ArtifactPanel({ text, streaming }: { text: string; streaming: boolean }) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-3">
        <p className="text-sm font-medium">Artifact</p>
        {streaming ? <span className="size-2 animate-pulse rounded-full bg-accent ring-4 ring-accent/20" /> : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <ArtifactBody text={text} />
      </div>
    </div>
  );
}
