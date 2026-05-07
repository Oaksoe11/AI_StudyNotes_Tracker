import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { BookOpen, FolderOpen, LayoutDashboard, Upload } from "lucide-react";

import "./globals.css";

export const metadata: Metadata = {
  title: "AI Study Notes Tracker",
  description: "Generate lecture notes from uploaded PDFs."
};

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/folders", label: "Folders", icon: FolderOpen },
  { href: "/documents/demo", label: "Documents", icon: Upload },
  { href: "/notes/demo", label: "Notes", icon: BookOpen }
];

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <Link href="/dashboard" className="flex items-center gap-3 font-semibold">
                <span className="grid size-9 place-items-center rounded-md bg-ink text-white">
                  <BookOpen size={18} />
                </span>
                Study Notes
              </Link>
              <nav className="hidden items-center gap-2 md:flex">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-ink"
                  >
                    <item.icon size={16} />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
