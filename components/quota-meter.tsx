import { quotaPercent } from "@/lib/ui/workspace";
import { Progress } from "@/components/ui/progress";

export function QuotaMeter({
  used,
  limit,
  labelled = true,
}: {
  used: number;
  limit: number;
  labelled?: boolean;
}) {
  const percent = quotaPercent(used, limit);

  return (
    <div className="space-y-2">
      {labelled ? (
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">Monthly tokens</span>
          <span className="font-mono text-xs text-foreground tabular-nums">
            {used.toLocaleString()} / {limit.toLocaleString()}
          </span>
        </div>
      ) : null}
      <Progress value={percent} aria-label={`Monthly token quota, ${percent} percent`} />
    </div>
  );
}
