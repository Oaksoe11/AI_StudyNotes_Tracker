"use client";

import { FormEvent, useState } from "react";
import { LogIn } from "lucide-react";

import { getSupabaseClient } from "@/lib/supabase";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error" | "missing-env">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabaseClient();

    if (!supabase) {
      setStatus("missing-env");
      return;
    }

    setStatus("loading");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` }
    });

    setStatus(error ? "error" : "sent");
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-line bg-card shadow-sm p-6">
      <h2 className="text-xl font-semibold">Login</h2>
      <label className="mt-5 block text-sm font-medium">
        Email
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 min-h-11 w-full rounded-md border border-line px-3 text-sm outline-none focus:border-coral"
          placeholder="you@example.com"
          required
        />
      </label>
      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-coral px-4 text-sm font-medium text-white shadow-sm transition hover:bg-berry disabled:opacity-60"
      >
        <LogIn size={16} />
        {status === "loading" ? "Sending link" : "Send magic link"}
      </button>
      {status === "sent" ? <p className="mt-3 text-sm text-emerald-700">Check your email for the login link.</p> : null}
      {status === "error" ? <p className="mt-3 text-sm text-red-700">Login failed. Try again.</p> : null}
      {status === "missing-env" ? <p className="mt-3 text-sm text-red-700">Add Supabase frontend environment variables first.</p> : null}
    </form>
  );
}
