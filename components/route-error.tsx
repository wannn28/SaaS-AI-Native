"use client";

import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Alert variant="destructive">
      <CircleAlert />
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription>{error.message || "This screen failed to load."}</AlertDescription>
      <AlertAction>
        <Button type="button" size="xs" variant="outline" onClick={() => reset()}>
          Retry
        </Button>
      </AlertAction>
    </Alert>
  );
}
