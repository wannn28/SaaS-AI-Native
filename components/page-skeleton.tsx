import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-56" />
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-48" />
    </div>
  );
}

export function AiSkeleton() {
  return (
    <div className="flex min-h-[32rem] flex-1 flex-col gap-4">
      <Skeleton className="h-7 w-40" />
      <div className="flex min-h-0 flex-1 overflow-hidden rounded-lg border border-border">
        <Skeleton className="hidden h-full w-[240px] rounded-none lg:block" />
        <div className="flex flex-1 flex-col gap-3 p-4">
          <Skeleton className="h-16 w-2/3" />
          <Skeleton className="ml-auto h-12 w-1/2" />
          <Skeleton className="mt-auto h-24" />
        </div>
      </div>
    </div>
  );
}
