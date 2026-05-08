"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { AppSidebar } from "@/components/AppSidebar";

export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return <main className="mx-auto grid min-h-screen max-w-6xl px-6 py-10">{children}</main>;
  }

  return (
    <div className="min-h-screen md:grid md:grid-cols-[280px_minmax(0,1fr)]">
      <AppSidebar />
      <main className="min-w-0 px-4 py-5 sm:px-5 md:px-8 md:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
