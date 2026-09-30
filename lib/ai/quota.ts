export type PlanLimits = {
  free: number;
  pro: number;
};

export function quotaForPlan(plan: string, limits: PlanLimits): number {
  return plan === "pro" ? limits.pro : limits.free;
}

export function isQuotaExceeded(usedTokens: number, limit: number): boolean {
  return usedTokens >= limit;
}

export function startOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
}

export function totalTokens(inputTokens: number | undefined, outputTokens: number | undefined): number {
  return Math.max(0, inputTokens ?? 0) + Math.max(0, outputTokens ?? 0);
}
