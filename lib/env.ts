import { z } from "zod";

const emptyOrUrl = z
  .string()
  .optional()
  .transform((value) => value ?? "")
  .refine((value) => value.length === 0 || isUrl(value), "Must be empty or a valid URL");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .optional()
    .transform((value) => value || "http://localhost:3010")
    .refine(isUrl, "Must be a valid URL"),
  DATABASE_URL: z.string().min(1),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default("/sign-in"),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default("/sign-up"),
  NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL: z.string().default("/dashboard"),
  NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL: z.string().default("/dashboard"),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  STRIPE_PRICE_PRO: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  AI_MODEL: z.string().min(1).default("gpt-4o-mini"),
  AI_QUOTA_FREE_TOKENS: z.coerce.number().int().positive().default(50_000),
  AI_QUOTA_PRO_TOKENS: z.coerce.number().int().positive().default(2_000_000),
  R2_ACCOUNT_ID: z.string().optional().transform((value) => value ?? ""),
  R2_ACCESS_KEY_ID: z.string().optional().transform((value) => value ?? ""),
  R2_SECRET_ACCESS_KEY: z.string().optional().transform((value) => value ?? ""),
  R2_BUCKET: z.string().optional().transform((value) => value ?? ""),
  SENTRY_DSN: emptyOrUrl,
  NEXT_PUBLIC_SENTRY_DSN: emptyOrUrl,
  SENTRY_ENVIRONMENT: z.string().optional().transform((value) => value || "development"),
});

export type AppEnv = z.infer<typeof envSchema>;

export class EnvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvError";
  }
}

export function parseEnv(source: Record<string, string | undefined>): AppEnv {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("; ");
    throw new EnvError(`Invalid environment: ${details}`);
  }
  return result.data;
}

let cached: AppEnv | undefined;

export function getEnv(): AppEnv {
  if (!cached) {
    cached = parseEnv(process.env);
  }
  return cached;
}

export function resetEnvCache(): void {
  cached = undefined;
}

function isUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
