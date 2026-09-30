import { and, asc, desc, eq } from "drizzle-orm";
import { aiMessages, aiSessions, usageEvents, type AiSession } from "@/drizzle/schema";
import { isUuid } from "@/lib/billing/plans";
import { getDb } from "@/lib/db/client";

export async function listSessions(userId: string): Promise<AiSession[]> {
  return getDb()
    .select()
    .from(aiSessions)
    .where(eq(aiSessions.userId, userId))
    .orderBy(desc(aiSessions.updatedAt));
}

export async function getOwnedSession(userId: string, sessionId: string | undefined): Promise<AiSession | null> {
  if (!sessionId || !isUuid(sessionId)) return null;
  const [session] = await getDb()
    .select()
    .from(aiSessions)
    .where(and(eq(aiSessions.id, sessionId), eq(aiSessions.userId, userId)))
    .limit(1);
  return session ?? null;
}

export async function createSession(userId: string, title: string): Promise<AiSession> {
  const [session] = await getDb()
    .insert(aiSessions)
    .values({ userId, title: title.slice(0, 80) || "New session" })
    .returning();
  if (!session) {
    throw new Error("Failed to create session");
  }
  return session;
}

export async function recordUserMessage(sessionId: string, content: string): Promise<void> {
  const db = getDb();
  const [latest] = await db
    .select({ role: aiMessages.role, content: aiMessages.content })
    .from(aiMessages)
    .where(eq(aiMessages.sessionId, sessionId))
    .orderBy(desc(aiMessages.createdAt))
    .limit(1);

  if (latest?.role === "user" && latest.content === content) return;

  await db.insert(aiMessages).values({ sessionId, role: "user", content });
  await touchSession(sessionId);
}

export async function recordAssistantTurn(input: {
  userId: string;
  sessionId: string;
  content: string;
  tokenIn: number;
  tokenOut: number;
  model: string;
}): Promise<void> {
  const db = getDb();
  await db.insert(aiMessages).values({
    sessionId: input.sessionId,
    role: "assistant",
    content: input.content,
    tokenIn: input.tokenIn,
    tokenOut: input.tokenOut,
  });
  await db.insert(usageEvents).values({
    userId: input.userId,
    kind: "chat",
    tokens: input.tokenIn + input.tokenOut,
    meta: {
      sessionId: input.sessionId,
      model: input.model,
      tokenIn: input.tokenIn,
      tokenOut: input.tokenOut,
    },
  });
  await touchSession(input.sessionId);
}

export async function listSessionMessages(sessionId: string) {
  return getDb()
    .select()
    .from(aiMessages)
    .where(eq(aiMessages.sessionId, sessionId))
    .orderBy(asc(aiMessages.createdAt));
}

async function touchSession(sessionId: string): Promise<void> {
  await getDb().update(aiSessions).set({ updatedAt: new Date() }).where(eq(aiSessions.id, sessionId));
}
