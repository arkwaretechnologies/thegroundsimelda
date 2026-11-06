"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FormStyle = {
  /** Extra classes for inputs (e.g. dark theme overrides). */
  inputClassName?: string;
  submitClassName?: string;
  secondaryClassName?: string;
  /** Prefix for input ids so two forms can coexist on a page. */
  idPrefix?: string;
};

async function signInWithGoogle(next: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) toast.error(error.message);
}

function OrDivider() {
  return (
    <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
      <span className="h-px flex-1 bg-current opacity-20" />
      or
      <span className="h-px flex-1 bg-current opacity-20" />
    </div>
  );
}

export function LoginForm({
  next = "/dashboard",
  onSuccess,
  inputClassName,
  submitClassName,
  secondaryClassName,
  idPrefix = "login",
}: FormStyle & {
  next?: string;
  /** Called after a successful password sign-in. */
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back");
    onSuccess();
  }

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-email`}>Email</Label>
          <Input
            id={`${idPrefix}-email`}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className={inputClassName}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-password`}>Password</Label>
          <Input
            id={`${idPrefix}-password`}
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClassName}
          />
        </div>
        <Button
          type="submit"
          className={cn("w-full", submitClassName)}
          disabled={loading}
        >
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <OrDivider />
      <Button
        type="button"
        variant="outline"
        className={cn("w-full", secondaryClassName)}
        onClick={() => signInWithGoogle(next)}
      >
        Continue with Google
      </Button>
    </>
  );
}

export function SignupForm({
  next = "/dashboard",
  onSuccess,
  onNeedsConfirmation,
  inputClassName,
  submitClassName,
  secondaryClassName,
  idPrefix = "signup",
}: FormStyle & {
  next?: string;
  /** Called when sign-up returns an active session. */
  onSuccess: () => void;
  /** Called when the account needs email confirmation before a session exists. */
  onNeedsConfirmation: (email: string) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      toast.success("Account created — welcome!");
      onSuccess();
    } else {
      onNeedsConfirmation(email);
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-name`}>Full name</Label>
          <Input
            id={`${idPrefix}-name`}
            autoComplete="name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputClassName}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-email`}>Email</Label>
          <Input
            id={`${idPrefix}-email`}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClassName}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-password`}>Password</Label>
          <Input
            id={`${idPrefix}-password`}
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClassName}
          />
        </div>
        <Button
          type="submit"
          className={cn("w-full", submitClassName)}
          disabled={loading}
        >
          {loading ? "Creating…" : "Create account"}
        </Button>
      </form>
      <OrDivider />
      <Button
        type="button"
        variant="outline"
        className={cn("w-full", secondaryClassName)}
        onClick={() => signInWithGoogle(next)}
      >
        Continue with Google
      </Button>
    </>
  );
}
