import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
} from "ai";
import { ensureAppUser } from "@/lib/auth/current-user";
import { getEntitlement, getMonthlyUsage, quotaLimitFor } from "@/lib/billing/entitlements";
import { isQuotaExceeded, totalTokens } from "@/lib/ai/quota";
import { ChatRequestError, latestUserText, parseChatRequest } from "@/lib/ai/messages";
import { getChatModel } from "@/lib/ai/provider";
import { createSession, getOwnedSession, recordAssistantTurn, recordUserMessage } from "@/lib/ai/sessions";
import { getEnv } from "@/lib/env";
import { captureException } from "@/lib/monitoring/sentry";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const user = await ensureAppUser();
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  let parsed: ReturnType<typeof parseChatRequest>;
  try {
    parsed = parseChatRequest(body);
  } catch (error) {
    if (error instanceof ChatRequestError) {
      return Response.json({ error: "invalid_request", message: error.message }, { status: 400 });
    }
    throw error;
  }

  const prompt = latestUserText(parsed.messages).trim();
  if (!prompt) {
    return Response.json({ error: "empty_message" }, { status: 400 });
  }

  const entitlement = await getEntitlement(user.id);
  const plan = entitlement?.status === "active" || entitlement?.status === "trialing" ? entitlement.plan : "free";
  const limit = quotaLimitFor(plan);
  const used = await getMonthlyUsage(user.id);
  if (isQuotaExceeded(used, limit)) {
    return Response.json({ error: "quota_exceeded", used, limit, plan }, { status: 402 });
  }

  const existing = await getOwnedSession(user.id, parsed.sessionId);
  if (parsed.sessionId && !existing) {
    return Response.json({ error: "session_not_found" }, { status: 404 });
  }

  const session = existing ?? (await createSession(user.id, prompt));
  await recordUserMessage(session.id, prompt);

  const env = getEnv();
  try {
    const result = streamText({
      model: getChatModel(),
      system:
        "You are a concise assistant inside a SaaS workspace. Answer the user's latest message using the conversation. Do not invent billing or account facts.",
      messages: await convertToModelMessages(parsed.messages),
      onFinish: async ({ text, usage }) => {
        try {
          await recordAssistantTurn({
            userId: user.id,
            sessionId: session.id,
            content: text,
            tokenIn: usage.inputTokens ?? 0,
            tokenOut: usage.outputTokens ?? 0,
            model: env.AI_MODEL,
          });
        } catch (error) {
          captureException(error, {
            route: "ai.chat.persist",
            userId: user.id,
            tokens: totalTokens(usage.inputTokens, usage.outputTokens),
          });
        }
      },
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({ stream: result.stream }),
      headers: { "x-session-id": session.id },
    });
  } catch (error) {
    captureException(error, { route: "ai.chat", userId: user.id });
    return Response.json({ error: "chat_failed" }, { status: 502 });
  }
}
