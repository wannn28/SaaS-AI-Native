"use server";

import { redirect } from "next/navigation";
import { ensureAppUser } from "@/lib/auth/current-user";
import { createSession } from "@/lib/ai/sessions";

export async function createAiSession(formData: FormData) {
  const user = await ensureAppUser();
  if (!user) {
    redirect("/sign-in");
  }

  const title = String(formData.get("title") ?? "").trim() || "New session";
  const session = await createSession(user.id, title);
  redirect(`/ai?session=${session.id}`);
}
