import { createOpenAI } from "@ai-sdk/openai";
import { getEnv } from "@/lib/env";

export function getChatModel() {
  const env = getEnv();
  const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });
  return openai(env.AI_MODEL);
}
