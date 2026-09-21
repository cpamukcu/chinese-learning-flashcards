"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "sending" | "sent" | "error";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.1-4 1.1-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.4 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.4a12 12 0 0 0 0 10.8l4-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z"
      />
    </svg>
  );
}

export function LoginForm({
  configured,
  callbackError,
}: {
  configured: boolean;
  callbackError: boolean;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(
    callbackError ? "That sign-in link didn't work. Please try again." : null,
  );

  const redirectTo = () => `${window.location.origin}/auth/callback`;

  async function signInWithEmail(event: FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setMessage(null);

    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo() },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("sent");
    }
  }

  async function signInWithGoogle() {
    setMessage(null);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo() },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome</CardTitle>
        <CardDescription>
          Log in or sign up — no password needed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!configured && (
          <p
            role="alert"
            className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground"
          >
            Supabase isn&apos;t configured yet. Add your keys to{" "}
            <code>.env.local</code> (see the README) and restart the dev server.
          </p>
        )}

        {status === "sent" ? (
          <div role="status" className="space-y-2 text-center">
            <p className="font-medium">Check your inbox</p>
            <p className="text-sm text-muted-foreground">
              We sent a sign-in link to <strong>{email}</strong>. Open it on
              this device to continue.
            </p>
            <Button variant="ghost" onClick={() => setStatus("idle")}>
              Use a different email
            </Button>
          </div>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full gap-2"
              onClick={signInWithGoogle}
              disabled={!configured}
            >
              <GoogleIcon />
              Continue with Google
            </Button>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={signInWithEmail} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!configured}
                  className="h-11 text-base"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={!configured || status === "sending"}
              >
                {status === "sending" ? "Sending…" : "Email me a sign-in link"}
              </Button>
            </form>
          </>
        )}

        {message && (
          <p role="alert" className="text-center text-sm text-destructive">
            {message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
