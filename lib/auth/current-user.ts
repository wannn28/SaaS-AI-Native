import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { entitlements, users, type User } from "@/drizzle/schema";
import { getDb } from "@/lib/db/client";

export async function ensureAppUser(): Promise<User | null> {
  const session = await auth();
  if (!session.userId) return null;

  const clerkUser = await currentUser();
  const email =
    clerkUser?.emailAddresses.find((entry) => entry.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ??
    clerkUser?.emailAddresses[0]?.emailAddress ??
    null;

  const db = getDb();
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, session.userId))
    .limit(1);

  if (existing[0]) {
    if (email && existing[0].email !== email) {
      const [updated] = await db
        .update(users)
        .set({ email })
        .where(eq(users.id, existing[0].id))
        .returning();
      return updated ?? existing[0];
    }
    return existing[0];
  }

  try {
    const [created] = await db
      .insert(users)
      .values({ clerkUserId: session.userId, email })
      .returning();
    if (!created) return null;

    await db.insert(entitlements).values({
      userId: created.id,
      plan: "free",
      status: "active",
    });
    return created;
  } catch {
    const raced = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, session.userId))
      .limit(1);
    return raced[0] ?? null;
  }
}

export async function requireAppUser(): Promise<User> {
  const user = await ensureAppUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
