/**
 * Monitoring stub. Install @sentry/nextjs and call Sentry.captureException here
 * once SENTRY_DSN is set. Until then, failures are logged and the process continues.
 */
export function captureException(error: unknown, context?: Record<string, unknown>): void {
  const configured = Boolean(process.env.SENTRY_DSN);
  console.error(configured ? "[sentry]" : "[monitor]", error, context ?? "");
}
