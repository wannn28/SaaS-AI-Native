import { clerkMiddleware } from "@clerk/nextjs/server";
import { requiresPageAuth } from "@/lib/auth/routes";

/**
 * Next.js 16 renamed Middleware to Proxy. This file is that boundary:
 * Clerk attaches the session on matched requests, and protected pages
 * redirect to sign-in. Route handlers still authorize themselves and
 * return 401 JSON when the caller is signed out.
 */
export default clerkMiddleware(async (auth, request) => {
  if (requiresPageAuth(request.nextUrl.pathname)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
