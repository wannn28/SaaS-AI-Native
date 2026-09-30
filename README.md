# SaaS AI Native

Production scaffold for an AI-native SaaS monolith. The Next.js app owns the UI, Route Handlers, and Server Actions. Postgres is the source of truth for users, entitlements, chat history, and token usage.

## Stack

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- PostgreSQL 17, Drizzle ORM, drizzle-kit
- Clerk authentication (`proxy.ts` is the Next.js 16 name for middleware)
- Stripe Checkout, Customer Portal, and a signature-verified webhook
- Vercel AI SDK `streamText` on `POST /api/ai/chat` (`useChat`-compatible)
- Optional Cloudflare R2 presigned uploads
- Docker Compose, GitHub Actions, Sentry env placeholders

The app listens on port **3010**.

## Local setup

Requirements: Node.js 22, npm, and Docker (for Postgres).

```bash
cp .env.example .env
# Fill Clerk, Stripe, and OpenAI placeholders before exercising those features.

docker compose up -d postgres
npm install
npm run db:migrate
npm run dev
```

Open http://localhost:3010.

`npm run dev` and `npm start` both bind port 3010. Protected pages (`/dashboard`, `/ai`, `/settings`, and any future non-API page) redirect to Clerk sign-in. `/`, `/sign-in`, `/sign-up`, `/api/health`, and `/api/webhooks/stripe` stay public. Other API routes return `401` when the caller is signed out.

The publishable key in `.env.example` is only format-valid, so the Node process can boot before you create a Clerk app. A browser request with that key is redirected to Clerk's handshake and comes back `Invalid host`. Replace `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`, then restart, before using the UI. `NEXT_PUBLIC_*` values are inlined at build time, so rebuild after changing them. Docker runs `node server.js` from the standalone output. `npm start` prints a Next.js warning because `output: "standalone"` is enabled; use it for a local production check, and use the container for deploy.

### Full stack in Docker

```bash
cp .env.example .env
docker compose up --build
npm run db:migrate
```

Migrations run from the host against `localhost:5432`. The app container reaches Postgres at `postgres:5432`.

## Schema

`drizzle/schema.ts` defines:

| Table | Purpose |
| --- | --- |
| `users` | App user keyed by unique `clerk_user_id` |
| `entitlements` | Plan, status, Stripe ids, period end. This row decides access. |
| `ai_sessions` / `ai_messages` | Workspace history and per-message token counts |
| `usage_events` | Metered token usage (`kind`, `tokens`, `meta` jsonb) |
| `stripe_webhook_events` | Idempotency ledger keyed by Stripe event id |

The first authenticated request inserts the user and a `free` / `active` entitlement.

```bash
npm run db:generate   # after schema edits
npm run db:migrate
npm run db:studio
```

## HTTP API

| Method | Path | Auth | Behavior |
| --- | --- | --- | --- |
| `POST` | `/api/ai/chat` | Clerk session | `useChat` body (`messages`, optional `sessionId`). Streams UI message chunks, persists the turn, enforces the monthly token quota. Reuse the `x-session-id` response header on later turns. |
| `POST` | `/api/billing/checkout` | Clerk session | Creates a Stripe Checkout subscription session. Returns `{ url }`. |
| `POST` | `/api/billing/portal` | Clerk session | Creates a Customer Portal session. Returns `{ url }`, or `409 no_customer` before the first checkout. |
| `POST` | `/api/webhooks/stripe` | Stripe signature | Verifies `Stripe-Signature`, claims the event id, then updates entitlements. |
| `GET` | `/api/health` | Public | Liveness probe. |

Quota responses use `402` and `{ error: "quota_exceeded", used, limit, plan }`. Free and past-due accounts use `AI_QUOTA_FREE_TOKENS`. Active or trialing `pro` accounts use `AI_QUOTA_PRO_TOKENS`. Usage is the sum of `usage_events` since the start of the UTC month.

Chat routes run on the Node.js runtime. `maxDuration` is 60 seconds for hosts that honor it. Terminate TLS in Nginx and allow a longer read timeout there (see below).

`app/(app)/ai/actions.ts` is the Server Action that creates a session.

## Billing

Stripe Checkout writes `userId` onto the session and subscription metadata. The webhook handles:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

A duplicate event id returns `{ received: true, duplicate: true }` and does not apply twice. If handling throws, the claim row is deleted so Stripe can retry. A canceled subscription sets the plan back to `free`.

Point the Stripe webhook at `https://ai.iquee.tech/api/webhooks/stripe`. Locally:

```bash
stripe listen --forward-to localhost:3010/api/webhooks/stripe
```

## Storage and monitoring

`lib/storage/r2.ts` exposes `createPresignedUploadUrl`. It throws until `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_BUCKET` are all set.

`SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` are optional. `lib/monitoring/sentry.ts` logs exceptions. Install `@sentry/nextjs` there when a DSN exists. Do not commit a DSN.

## Security headers

`next.config.ts` sets `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, and `Permissions-Policy`, and removes `X-Powered-By`.

HSTS belongs on Nginx, because TLS terminates there. Sending HSTS from the Node process would also affect local HTTP.

## Nginx on the VPS

`ai.iquee.tech` already has a certificate. Do not replace those `ssl_certificate` lines. Point the upstream at the app:

```nginx
proxy_pass http://127.0.0.1:3010;
proxy_http_version 1.1;
proxy_set_header Host $host;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_buffering off;
proxy_read_timeout 300s;
proxy_send_timeout 300s;
```

`proxy_buffering off` and the 300s read timeout keep AI token streams moving. A reference file is in `deploy/nginx/ai.iquee.tech.conf`.

Production Compose uses host networking for the app so it binds `127.0.0.1:3010`. Postgres is published only on `127.0.0.1:5432`. Keep 5432 off the public firewall; expose 80 and 443.

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Set real values in the VPS environment first (`POSTGRES_PASSWORD`, Clerk, Stripe, `OPENAI_API_KEY`). `NEXT_PUBLIC_*` values are also Docker build args, because Next inlines them at build time. Rebuild the image after changing them.

## GitHub Actions

- `.github/workflows/ci.yml` runs lint, typecheck, and Vitest on pull requests and on pushes to `main`.
- `.github/workflows/deploy.yml` is manual. It does nothing until the repository secrets `VPS_HOST`, `VPS_USER`, and `VPS_SSH_KEY` exist. Optional `VPS_PATH` defaults to `/opt/saas-ai`. No secrets are committed.

## Tests

```bash
npm test
npm run lint
npm run typecheck
```

Playwright is configured but not part of CI. See `e2e/README.md`.

## UI scaffold

Dark tokens are the default: background `#09090B`, surface `#18181B`, elevated `#27272A`, text `#FAFAFA`, muted `#A1A1AA`, border `#27272A`, accent `#22D3EE`. Fonts are Inter and JetBrains Mono. The signed-in shell is a 240px sidebar and a 56px header. Routes: `/sign-in`, `/sign-up`, `/dashboard`, `/ai`, `/settings`. There is no floating chatbot.
