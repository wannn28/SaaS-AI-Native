import { describe, expect, it } from "vitest";
import { latestUserText, parseChatRequest } from "@/lib/ai/messages";

describe("parseChatRequest", () => {
  it("keeps an explicit session id and ignores the useChat client id", () => {
    const parsed = parseChatRequest({
      id: "client-chat-id",
      sessionId: "11111111-1111-4111-8111-111111111111",
      messages: [{ role: "user", content: "Hello" }],
    });

    expect(parsed.sessionId).toBe("11111111-1111-4111-8111-111111111111");
    expect(latestUserText(parsed.messages)).toBe("Hello");
  });

  it("does not treat a missing session id as the client chat id", () => {
    const parsed = parseChatRequest({
      id: "client-chat-id",
      messages: [{ id: "m1", role: "user", parts: [{ type: "text", text: "Hi" }] }],
    });

    expect(parsed.sessionId).toBeUndefined();
    expect(latestUserText(parsed.messages)).toBe("Hi");
  });
});
