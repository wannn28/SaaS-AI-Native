const PUBLIC_PREFIXES = ["/sign-in", "/sign-up", "/api/health", "/api/webhooks/stripe"];

export function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/** Page routes that Clerk proxy must redirect to sign-in. API routes authenticate themselves. */
export function requiresPageAuth(pathname: string): boolean {
  if (pathname.startsWith("/api/") || pathname.startsWith("/__clerk")) return false;
  return !isPublicPath(pathname);
}
