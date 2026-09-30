import { describe, expect, it } from "vitest";
import { isPublicPath, requiresPageAuth } from "@/lib/auth/routes";

describe("auth routes", () => {
  it("keeps marketing, auth, health, and the Stripe webhook public", () => {
    expect(isPublicPath("/")).toBe(true);
    expect(isPublicPath("/sign-in")).toBe(true);
    expect(isPublicPath("/sign-in/factor-one")).toBe(true);
    expect(isPublicPath("/api/webhooks/stripe")).toBe(true);
    expect(isPublicPath("/api/health")).toBe(true);
  });

  it("requires a session for product pages and leaves API auth to the handlers", () => {
    expect(requiresPageAuth("/dashboard")).toBe(true);
    expect(requiresPageAuth("/ai")).toBe(true);
    expect(requiresPageAuth("/settings")).toBe(true);
    expect(requiresPageAuth("/")).toBe(false);
    expect(requiresPageAuth("/api/ai/chat")).toBe(false);
  });
});
