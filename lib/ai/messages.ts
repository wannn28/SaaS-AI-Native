import type { UIMessage } from "ai";

export class ChatRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChatRequestError";
  }
}

export function parseChatRequest(input: unknown): { sessionId?: string; messages: UIMessage[] } {
  if (!input || typeof input !== "object") {
    throw new ChatRequestError("Request body must be an object");
  }

  const body = input as Record<string, unknown>;
  // `id` is the useChat client id, not an ai_sessions primary key.
  const sessionId = typeof body.sessionId === "string" && body.sessionId.length > 0 ? body.sessionId : undefined;

  return {
    sessionId,
    messages: normalizeMessages(body.messages),
  };
}

export function textFromParts(parts: UIMessage["parts"] | undefined): string {
  if (!parts) return "";
  return parts
    .filter((part) => part.type === "text" && "text" in part && typeof part.text === "string")
    .map((part) => ("text" in part ? part.text : ""))
    .join("");
}

export function latestUserText(messages: UIMessage[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role === "user") return textFromParts(message.parts);
  }
  return "";
}

function normalizeMessages(input: unknown): UIMessage[] {
  if (!Array.isArray(input) || input.length === 0) {
    throw new ChatRequestError("messages must be a non-empty array");
  }

  return input.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new ChatRequestError(`messages[${index}] is invalid`);
    }

    const record = item as Record<string, unknown>;
    const role = record.role;
    if (role !== "user" && role !== "assistant" && role !== "system") {
      throw new ChatRequestError(`messages[${index}].role is invalid`);
    }

    let parts: unknown = record.parts;
    if (!Array.isArray(parts) && typeof record.content === "string") {
      parts = [{ type: "text", text: record.content }];
    }
    if (!Array.isArray(parts)) {
      throw new ChatRequestError(`messages[${index}].parts is required`);
    }

    return {
      id: typeof record.id === "string" ? record.id : `msg-${index}`,
      role,
      parts,
    } as UIMessage;
  });
}
