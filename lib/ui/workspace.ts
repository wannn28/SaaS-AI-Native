export const workspaceCommands = [
  { href: "/dashboard", label: "Dashboard", hint: "Plan and usage" },
  { href: "/ai", label: "AI", hint: "Sessions and chat" },
  { href: "/settings", label: "Settings", hint: "Profile and plan" },
] as const;

export type WorkspaceCommand = (typeof workspaceCommands)[number];

export type SessionListItem = {
  id: string;
  title: string;
  updatedLabel: string;
};

export type StoredTurn = {
  id: string;
  role: string;
  content: string;
};

export type InitialChatMessage = {
  id: string;
  role: "user" | "assistant";
  parts: [{ type: "text"; text: string }];
};

export type CodeBlock = {
  language: string;
  code: string;
};

const fencePattern = /```([^\n`]*)\n?([\s\S]*?)```/g;

export function filterCommands(query: string): readonly WorkspaceCommand[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return workspaceCommands;
  return workspaceCommands.filter((item) =>
    `${item.label} ${item.hint} ${item.href}`.toLowerCase().includes(needle),
  );
}

export function quotaPercent(used: number, limit: number): number {
  if (!Number.isFinite(used) || !Number.isFinite(limit) || limit <= 0) return 0;
  const ratio = Math.min(1, Math.max(0, used / limit));
  return Math.round(ratio * 100);
}

export function formatActivityTime(input: Date | string): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

export function toInitialMessages(rows: StoredTurn[]): InitialChatMessage[] {
  const messages: InitialChatMessage[] = [];
  for (const row of rows) {
    if (row.role !== "user" && row.role !== "assistant") continue;
    messages.push({
      id: row.id,
      role: row.role,
      parts: [{ type: "text", text: row.content }],
    });
  }
  return messages;
}

export function extractCodeBlocks(text: string): CodeBlock[] {
  const blocks: CodeBlock[] = [];
  for (const match of text.matchAll(fencePattern)) {
    const language = (match[1] ?? "").trim().replace(/\r/g, "") || "text";
    const code = (match[2] ?? "").replace(/\r\n/g, "\n").replace(/\n$/, "");
    if (!code.trim()) continue;
    blocks.push({ language, code });
  }
  return blocks;
}

export function isChatBusy(status: string): boolean {
  return status === "submitted" || status === "streaming";
}
