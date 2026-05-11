"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChevronDown, ChevronRight, FileText, FolderOpen, LayoutDashboard, ListChecks, LogOut, Menu, MoonStar, Upload, X } from "lucide-react";
import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/ThemeToggle";
import { getSupabaseClient } from "@/lib/supabase";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// These small types help TypeScript understand the shape of data coming from the backend.
type Folder = {
  id: string;
  name: string;
};

type Note = {
  id: string;
  title: string;
  tone?: string;
};

type FolderDetail = {
  notes: Note[];
};

// The top section of the sidebar is just a list of main app pages.
const mainLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/folders", label: "Folders", icon: FolderOpen },
  { href: "/documents", label: "Documents", icon: Upload },
  { href: "/notes", label: "Notes", icon: BookOpen },
  { href: "/quizzes", label: "Quizzes", icon: ListChecks }
];

export function AppSidebar() {
  // usePathname tells us which page is active so we can highlight the current link.
  const pathname = usePathname();
  // Folders are loaded from the backend because each user has their own folders.
  const [folders, setFolders] = useState<Folder[]>([]);
  // Only one folder is expanded at a time in the sidebar.
  const [expandedFolderId, setExpandedFolderId] = useState<string | null>(null);
  // This stores notes for folders after a folder is opened.
  // It avoids loading every folder's notes immediately.
  const [folderNotes, setFolderNotes] = useState<Record<string, Note[]>>({});
  // Simple loading/error state for the folder list.
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  // On phones, the sidebar becomes a drawer, so we need open/closed state.
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  async function authHeaders(): Promise<Record<string, string>> {
    // Supabase stores the login session in the browser.
    const supabase = getSupabaseClient();
    const { data } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
    // The FastAPI backend expects a Bearer token for protected routes.
    return data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {};
  }

  async function logout() {
    const supabase = getSupabaseClient();
    // Sign out from Supabase and clear the cookie used by server-rendered pages.
    await supabase?.auth.signOut();
    document.cookie = "sb-access-token=; path=/; max-age=0; SameSite=Lax";
    window.location.assign("/login");
  }

  async function loadFolders() {
    setStatus("loading");

    try {
      // Load folders for the current user.
      const response = await fetch(`${apiUrl}/folders`, { headers: await authHeaders() });
      if (!response.ok) {
        throw new Error("Unable to load folders");
      }
      const nextFolders = await response.json();
      setFolders(nextFolders);
      // If the expanded folder was deleted, close it.
      setExpandedFolderId((current) => nextFolders.some((folder: Folder) => folder.id === current) ? current : null);
      setFolderNotes((current) => {
        // Remove cached notes for folders that no longer exist.
        const folderIds = new Set(nextFolders.map((folder: Folder) => folder.id));
        return Object.fromEntries(Object.entries(current).filter(([folderId]) => folderIds.has(folderId)));
      });
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  useEffect(() => {
    // Load folders as soon as the sidebar appears.
    loadFolders();

    function handleDataChanged() {
      // Other components dispatch this event after create/delete actions.
      loadFolders();
    }

    window.addEventListener("study-notes:data-changed", handleDataChanged);
    return () => window.removeEventListener("study-notes:data-changed", handleDataChanged);
  }, []);

  useEffect(() => {
    // Close the mobile menu whenever navigation changes.
    setIsMobileMenuOpen(false);
  }, [pathname]);

  async function toggleFolder(folderId: string) {
    // Clicking an already-open folder closes it.
    const nextFolderId = expandedFolderId === folderId ? null : folderId;
    setExpandedFolderId(nextFolderId);

    // If closing, or if notes are already loaded, no extra API call is needed.
    if (!nextFolderId || folderNotes[folderId]) {
      return;
    }

    try {
      // Fetch this folder's notes only when the folder is opened.
      const response = await fetch(`${apiUrl}/folders/${folderId}`, { headers: await authHeaders() });
      if (!response.ok) {
        throw new Error("Unable to load folder notes");
      }
      const detail = (await response.json()) as FolderDetail;
      setFolderNotes((current) => ({ ...current, [folderId]: detail.notes ?? [] }));
    } catch {
      // If the folder detail fails, show "No notes yet" instead of crashing the sidebar.
      setFolderNotes((current) => ({ ...current, [folderId]: [] }));
    }
  }

  return (
    <>
      {/* Mobile header: this replaces the permanent sidebar on small screens. */}
      <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-line bg-card/95 px-4 shadow-sm backdrop-blur md:hidden">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-3 font-semibold">
          <span className="grid size-10 shrink-0 place-items-center rounded-md bg-coral text-white shadow-sm">
            <BookOpen size={19} />
          </span>
          <span className="truncate">Study Notes</span>
        </Link>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="grid size-11 place-items-center rounded-md border border-line text-muted hover:border-coral hover:text-coral"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Dark overlay behind the mobile drawer. Tapping it closes the drawer. */}
      {isMobileMenuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/35 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="Close navigation overlay"
        />
      ) : null}

      {/* Sidebar itself. It is always visible on desktop and slides in/out on mobile. */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full min-h-screen w-[min(20rem,calc(100vw-2rem))] flex-col border-r border-line bg-card/95 shadow-xl backdrop-blur transition-transform duration-200 md:sticky md:top-0 md:z-auto md:w-auto md:translate-x-0 md:bg-card/90 md:shadow-sm ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
      <div className="flex items-center justify-between gap-3 border-b border-line p-4">
        <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex min-w-0 items-center gap-3 font-semibold">
          <span className="grid size-10 place-items-center rounded-md bg-coral text-white shadow-sm">
            <BookOpen size={19} />
          </span>
          <span className="truncate">Study Notes</span>
        </Link>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(false)}
          className="grid size-10 shrink-0 place-items-center rounded-md border border-line text-muted hover:border-coral hover:text-coral md:hidden"
          aria-label="Close navigation"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <section className="space-y-1">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted">Main</p>
          {mainLinks.map((item) => {
            // A link is active if we are exactly on that page or inside one of its subpages.
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition ${
                  isActive ? "bg-coral text-white shadow-sm" : "text-muted hover:bg-mint/45 hover:text-ink dark:hover:bg-mint/20"
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            );
          })}
          <div className="flex items-center justify-between gap-3 rounded-md px-3 py-2">
            <span className="flex items-center gap-3 text-sm font-medium text-muted">
              <MoonStar size={16} />
              Dark mode
            </span>
            <ThemeToggle compact />
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-muted transition hover:bg-mint/45 hover:text-ink dark:hover:bg-mint/20"
          >
            <LogOut size={16} />
            Log out
          </button>
        </section>

        <section className="mt-6 space-y-1">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted">Folders</p>
          {folders.map((folder) => {
            // This decides whether we should show the note links under the folder.
            const isExpanded = expandedFolderId === folder.id;
            const notes = folderNotes[folder.id] ?? [];
            return (
              <div key={folder.id}>
                <button
                  type="button"
                  onClick={() => toggleFolder(folder.id)}
                  className="flex min-h-10 w-full items-center gap-2 rounded-md px-3 text-left text-sm font-medium text-muted transition hover:bg-mint/45 hover:text-ink dark:hover:bg-mint/20"
                >
                  {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  <FolderOpen size={15} />
                  <span className="min-w-0 flex-1 truncate">{folder.name}</span>
                </button>

                {isExpanded ? (
                  <div className="ml-6 mt-1 space-y-1 border-l border-line pl-2">
                    {notes.length ? (
                      notes.map((note) => (
                        <Link
                          key={note.id}
                          href={`/notes/${note.id}`}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex min-h-9 items-center gap-2 rounded-md px-2 text-sm transition ${
                            pathname === `/notes/${note.id}`
                              ? "bg-coral/15 text-coral"
                              : "text-muted hover:bg-mint/45 hover:text-ink dark:hover:bg-mint/20"
                          }`}
                        >
                          <FileText size={14} />
                          <span className="min-w-0 flex-1 truncate">{note.title}</span>
                        </Link>
                      ))
                    ) : (
                      <p className="rounded-md px-2 py-2 text-xs text-muted">No notes yet</p>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}

          {status === "loading" ? <p className="px-3 py-2 text-xs text-muted">Loading folders...</p> : null}
          {status === "error" ? <p className="px-3 py-2 text-xs text-red-600 dark:text-red-300">Could not load folders.</p> : null}
          {!folders.length && status === "idle" ? <p className="px-3 py-2 text-xs text-muted">No folders yet</p> : null}
        </section>

        <p className="mt-6 border-t border-line px-3 pt-4 text-xs text-muted">
          Copyright (c) 2026 Oak Soe Khant. All rights reserved.
        </p>
      </div>
    </aside>
    </>
  );
}
