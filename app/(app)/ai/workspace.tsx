"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { CircleAlert, MessageSquare, PanelRight } from "lucide-react";
import { cn } from "cn";
import { ArtifactBody, ArtifactPanel } from "@/components/artifact-panel";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { textFromParts } from "@/lib/ai/messages";
import { isChatBusy, type InitialChatMessage } from "@/lib/ui/workspace";

function messageText(message: UIMessage): string {
  return textFromParts(message.parts);
}

function latestAssistantText(messages: UIMessage[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role === "assistant") return messageText(message);
  }
  return "";
}

export function AiWorkspace({
  sessionId,
  initialMessages,
  hasSessions,
}: {
  sessionId?: string;
  initialMessages: InitialChatMessage[];
  hasSessions: boolean;
}) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/ai/chat",
        body: sessionId ? { sessionId } : undefined,
      }),
    [sessionId],
  );
  const { messages, sendMessage, status, error, stop, regenerate, clearError } = useChat({
    id: sessionId,
    messages: initialMessages as UIMessage[],
    transport,
  });
  const busy = isChatBusy(status);
  const artifactText = latestAssistantText(messages);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, status]);

  function submitText(text: string) {
    if (!sessionId || !text || busy) return;
    setInput("");
    clearError();
    void sendMessage({ text });
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1">
      <section className="flex min-h-0 min-w-0 flex-1 flex-col" aria-busy={busy}>
        <div className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border px-3">
          <h2 className="text-sm font-medium">Conversation</h2>
          <Sheet>
            <SheetTrigger className="xl:hidden" render={<Button variant="secondary" size="sm" />}>
              <PanelRight />
              Artifact
            </SheetTrigger>
            <SheetContent
              side="right"
              className="bg-surface data-[side=right]:w-full! data-[side=right]:sm:max-w-md!"
            >
              <SheetHeader>
                <SheetTitle>Artifact</SheetTitle>
                <SheetDescription>Latest assistant reply</SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
                <ArtifactBody text={artifactText} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <ScrollArea className="h-0 min-h-0 flex-1">
          <div className="flex min-h-full flex-col gap-3 p-4">
            {messages.length === 0 ? (
              sessionId ? (
                <EmptyState
                  icon={MessageSquare}
                  title="This session is empty"
                  description="Send a message. Replies stream into this thread."
                  action={
                    <Button type="button" variant="secondary" onClick={() => textareaRef.current?.focus()}>
                      Write a message
                    </Button>
                  }
                />
              ) : (
                <div className="m-auto flex max-w-sm flex-col items-center gap-2 px-6 py-10 text-center">
                  <MessageSquare className="size-8 text-muted-foreground" aria-hidden />
                  <p className="text-sm text-muted-foreground">
                    {hasSessions
                      ? "Select a session from the list."
                      : "Create a session in the list to start."}
                  </p>
                </div>
              )
            ) : (
              messages.map((message, index) => {
                const streaming = busy && index === messages.length - 1;
                return (
                  <article
                    key={message.id}
                    className={cn(
                      "max-w-[85%] rounded-lg px-3 py-2",
                      message.role === "user" ? "ml-auto bg-elevated" : "bg-background font-mono",
                      streaming && "animate-pulse bg-accent/20",
                    )}
                  >
                    <p className="font-sans text-[11px] tracking-wide text-muted-foreground uppercase">
                      {message.role}
                    </p>
                    <p className="mt-1 text-sm whitespace-pre-wrap">
                      {messageText(message) || (streaming ? "…" : "")}
                    </p>
                  </article>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
        <form
          className="shrink-0 border-t border-border bg-surface p-3"
          onSubmit={(event) => {
            event.preventDefault();
            submitText(input.trim());
          }}
        >
          {busy ? <div className="mb-2 h-1 animate-pulse rounded-full bg-accent/20" aria-hidden /> : null}
          {error ? (
            <Alert variant="destructive" className="mb-3">
              <CircleAlert />
              <AlertTitle>Message failed</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
              <AlertAction>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() => {
                    clearError();
                    void regenerate();
                  }}
                >
                  Retry
                </Button>
              </AlertAction>
            </Alert>
          ) : null}
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submitText(input.trim());
              }
            }}
            placeholder={sessionId ? "Message the workspace" : "Select a session to start"}
            disabled={!sessionId}
            rows={3}
            aria-label="Message"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {!sessionId
                ? "Create or select a session."
                : busy
                  ? status === "streaming"
                    ? "Streaming"
                    : "Sending"
                  : "Ready"}
            </p>
            {busy ? (
              <Button type="button" variant="secondary" onClick={() => stop()}>
                Stop
              </Button>
            ) : (
              <Button type="submit" disabled={!sessionId || input.trim().length === 0}>
                Send
              </Button>
            )}
          </div>
        </form>
      </section>
      <aside className="hidden w-80 shrink-0 border-l border-border xl:flex">
        <ArtifactPanel text={artifactText} streaming={busy} />
      </aside>
    </div>
  );
}
