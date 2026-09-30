import { describe, expect, it } from "vitest";
import { EnvError, parseEnv } from "@/lib/env";

const validEnv = {
  DATABASE_URL: "postgresql://saas:saas@localhost:5432/saas",
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_placeholder",
  CLERK_SECRET_KEY: "sk_test_placeholder",
  STRIPE_SECRET_KEY: "sk_test_placeholder",
  STRIPE_WEBHOOK_SECRET: "whsec_placeholder",
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_placeholder",
  STRIPE_PRICE_PRO: "price_placeholder",
  OPENAI_API_KEY: "sk-placeholder",
};

describe("parseEnv", () => {
  it("applies production defaults for optional settings", () => {
    const env = parseEnv(validEnv);

    expect(env.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3010");
    expect(env.AI_MODEL).toBe("gpt-4o-mini");
    expect(env.AI_QUOTA_FREE_TOKENS).toBe(50_000);
    expect(env.AI_QUOTA_PRO_TOKENS).toBe(2_000_000);
    expect(env.R2_BUCKET).toBe("");
    expect(env.SENTRY_DSN).toBe("");
  });

  it("rejects a missing database url", () => {
    const source = { ...validEnv, DATABASE_URL: undefined };

    expect(() => parseEnv(source)).toThrow(EnvError);
    expect(() => parseEnv(source)).toThrow(/DATABASE_URL/);
  });

  it("rejects a malformed app url", () => {
    expect(() => parseEnv({ ...validEnv, NEXT_PUBLIC_APP_URL: "not-a-url" })).toThrow(EnvError);
  });
});
