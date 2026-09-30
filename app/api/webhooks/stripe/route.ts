import { handleStripeWebhook } from "@/lib/billing/webhook";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");
  const result = await handleStripeWebhook(payload, signature);
  return Response.json(result.body, { status: result.status });
}
