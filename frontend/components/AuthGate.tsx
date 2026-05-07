"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { getSupabaseClient } from "@/lib/supabase";

function setSessionCookie(accessToken?: string) {
  if (accessToken) {
    document.cookie = `sb-access-token=${accessToken}; path=/; max-age=604800; SameSite=Lax`;
    return;
  }

  document.cookie = "sb-access-token=; path=/; max-age=0; SameSite=Lax";
}

export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isReady, setIsReady] = useState(pathname === "/login");

  useEffect(() => {
    const supabase = getSupabaseClient();

    if (!supabase) {
      setIsReady(true);
      return;
    }
    const client = supabase;

    async function syncSession() {
      const { data } = await client.auth.getSession();
      setSessionCookie(data.session?.access_token);

      if (!data.session && pathname !== "/login") {
        router.replace("/login");
        return;
      }

      if (data.session && pathname === "/login") {
        router.replace("/dashboard");
        return;
      }

      setIsReady(true);
    }

    syncSession();

    const {
      data: { subscription }
    } = client.auth.onAuthStateChange((_event, session) => {
      setSessionCookie(session?.access_token);
      if (!session) {
        router.replace("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  if (!isReady) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted">
        Loading study notes...
      </div>
    );
  }

  return children;
}
