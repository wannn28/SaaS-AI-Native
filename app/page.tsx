import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-8 px-6">
      <Wordmark />
      <div className="space-y-3">
        <p className="font-mono text-xs tracking-[0.2em] text-accent uppercase">ai.iquee.tech</p>
        <h1 className="text-4xl font-semibold tracking-tight">SaaS AI Native</h1>
        <p className="max-w-xl text-muted-foreground">
          Next.js monolith with Clerk, Stripe entitlements, and a streaming AI workspace. Product
          pages sit behind the app shell.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button nativeButton={false} render={<Link href="/sign-in" />}>
          Sign in
        </Button>
        <Button nativeButton={false} variant="secondary" render={<Link href="/dashboard" />}>
          Dashboard
        </Button>
      </div>
    </main>
  );
}
