import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppSidebar } from "@/components/AppSidebar";

import "./globals.css";

export const metadata: Metadata = {
  title: "AI Study Notes Tracker",
  description: "Generate lecture notes from uploaded PDFs."
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{const t=localStorage.getItem('theme');const d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d)}catch(e){}"
          }}
        />
      </head>
      <body>
        <div className="grid min-h-screen md:grid-cols-[280px_minmax(0,1fr)]">
          <AppSidebar />
          <main className="min-w-0 px-5 py-6 md:px-8 md:py-8">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
