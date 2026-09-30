import { CircleAlert } from "lucide-react";
import { RetryButton } from "@/components/retry-button";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function DataAlert({
  title = "Could not load this screen",
  message,
}: {
  title?: string;
  message: string;
}) {
  return (
    <Alert variant="destructive">
      <CircleAlert />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
      <AlertAction>
        <RetryButton />
      </AlertAction>
    </Alert>
  );
}
