"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function AiWorkspace({ sessionId }: { sessionId?: string }) {
  const [input, setInput] = useState("");
  const [transport] = useState(
    () =>
      new DefaultChatTransport({
        api: "/api/ai/chat",
        body: sessionId ? { sessionId } : undefined,
      }),
  );
  const { messages, sendMessage, status, error } = useChat({ transport });

  return (
    <div className="flex min-h-[560px] flex-col rounded-xl border border-border bg-surface">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Send a message to <span className="font-mono text-foreground">POST /api/ai/chat</span>.
            The route streams with the AI SDK and stores the turn in Postgres.
          </p>
        ) : (
          messages.map((message) => (
            <article key={message.id} className="space-y-1">
              <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">{message.role}</p>
              <p className="whitespace-pre-wrap text-sm">{messageText(message)}</p>
            </article>
          ))
        )}
      </div>
      <form
        className="flex flex-col gap-3 border-t border-border p-4"
        onSubmit={(event) => {
          event.preventDefault();
          const text = input.trim();
          if (!sessionId || !text || status === "submitted" || status === "streaming") return;
          setInput("");
          void sendMessage({ text });
        }}
      >
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask something"
          rows={3}
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {!sessionId
              ? "Create or select a session first."
              : error
                ? error.message
                : status === "ready"
                  ? "Ready"
                  : status}
          </p>
          <Button type="submit" disabled={!sessionId || status === "submitted" || status === "streaming"}>
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}

function messageText(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => ("text" in part ? part.text : ""))
    .join("");
}
