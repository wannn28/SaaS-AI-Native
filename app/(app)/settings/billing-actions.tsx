"use client";

import { useState } from "react";
import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function BillingActions({ hasCustomer }: { hasCustomer: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"checkout" | "portal" | null>(null);

  async function start(path: "/api/billing/checkout" | "/api/billing/portal") {
    setError(null);
    setPending(path.endsWith("checkout") ? "checkout" : "portal");
    try {
      const response = await fetch(path, { method: "POST" });
      const body = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !body.url) {
        setError(body.error ?? "request_failed");
        return;
      }
      window.location.href = body.url;
    } catch {
      setError("request_failed");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={pending !== null} onClick={() => void start("/api/billing/checkout")}>
          {pending === "checkout" ? "Opening Checkout…" : "Upgrade with Checkout"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={!hasCustomer || pending !== null}
          onClick={() => void start("/api/billing/portal")}
        >
          {pending === "portal" ? "Opening portal…" : "Customer portal"}
        </Button>
      </div>
      {error ? (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertTitle>Billing request failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
