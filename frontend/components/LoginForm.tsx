"use client";

import { FormEvent, useState } from "react";
import { LogIn, UserPlus } from "lucide-react";

import { getSupabaseClient } from "@/lib/supabase";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "check-email" | "error" | "missing-env">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabaseClient();

    if (!supabase) {
      setStatus("missing-env");
      return;
    }

    setStatus("loading");
    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (result.error) {
      setStatus("error");
      return;
    }

    if (!result.data.session?.access_token) {
      setStatus("check-email");
      return;
    }

    document.cookie = `sb-access-token=${result.data.session.access_token}; path=/; max-age=604800; SameSite=Lax`;

    setStatus("success");
    window.location.assign("/dashboard");
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-line bg-card shadow-sm p-6">
      <h2 className="text-xl font-semibold">{mode === "login" ? "Login" : "Create account"}</h2>
      <p className="mt-2 text-sm text-muted">Use your Gmail or email address as your username.</p>
      <label className="mt-5 block text-sm font-medium">
        Gmail or email
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 min-h-11 w-full rounded-md border border-line px-3 text-sm outline-none focus:border-coral"
          placeholder="you@example.com"
          required
        />
      </label>
      <label className="mt-4 block text-sm font-medium">
        Password
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 min-h-11 w-full rounded-md border border-line px-3 text-sm outline-none focus:border-coral"
          placeholder="Your password"
          minLength={6}
          required
        />
      </label>
      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-coral px-4 text-sm font-medium text-white shadow-sm transition hover:bg-berry disabled:opacity-60"
      >
        {mode === "login" ? <LogIn size={16} /> : <UserPlus size={16} />}
        {status === "loading" ? "Please wait" : mode === "login" ? "Login" : "Create account"}
      </button>
      <button
        type="button"
        onClick={() => {
          setMode(mode === "login" ? "signup" : "login");
          setStatus("idle");
        }}
        className="mt-3 text-sm font-medium text-coral hover:text-berry"
      >
        {mode === "login" ? "Need an account? Sign up" : "Already have an account? Login"}
      </button>
      {status === "success" ? <p className="mt-3 text-sm text-emerald-700">Signed in.</p> : null}
      {status === "check-email" ? <p className="mt-3 text-sm text-emerald-700">Check your email to confirm the account, then log in.</p> : null}
      {status === "error" ? <p className="mt-3 text-sm text-red-700">Auth failed. Check your email and password.</p> : null}
      {status === "missing-env" ? <p className="mt-3 text-sm text-red-700">Add Supabase frontend environment variables first.</p> : null}
    </form>
  );
}
