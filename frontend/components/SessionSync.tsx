"use client";

import { useEffect } from "react";

import { getSupabaseClient } from "@/lib/supabase";

function setSessionCookie(accessToken?: string) {
  if (accessToken) {
    document.cookie = `sb-access-token=${accessToken}; path=/; max-age=604800; SameSite=Lax`;
    return;
  }

  document.cookie = "sb-access-token=; path=/; max-age=0; SameSite=Lax";
}

export function SessionSync() {
  useEffect(() => {
    const supabase = getSupabaseClient();

    if (!supabase) {
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSessionCookie(data.session?.access_token);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionCookie(session?.access_token);
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
