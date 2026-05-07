import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppFrame } from "@/components/AppFrame";
import { AuthGate } from "@/components/AuthGate";

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
        <AuthGate>
          <AppFrame>{children}</AppFrame>
        </AuthGate>
      </body>
    </html>
  );
}
