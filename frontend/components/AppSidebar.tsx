"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChevronDown, ChevronRight, FileText, FolderOpen, LayoutDashboard, LogOut, MoonStar, Upload } from "lucide-react";
import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/ThemeToggle";
import { getSupabaseClient } from "@/lib/supabase";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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

const mainLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/folders", label: "Folders", icon: FolderOpen },
  { href: "/documents", label: "Documents", icon: Upload },
  { href: "/notes", label: "Notes", icon: BookOpen }
];

export function AppSidebar() {
  const pathname = usePathname();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [expandedFolderId, setExpandedFolderId] = useState<string | null>(null);
  const [folderNotes, setFolderNotes] = useState<Record<string, Note[]>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  async function authHeaders(): Promise<Record<string, string>> {
    const supabase = getSupabaseClient();
    const { data } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
    return data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {};
  }

  async function logout() {
    const supabase = getSupabaseClient();
    await supabase?.auth.signOut();
    document.cookie = "sb-access-token=; path=/; max-age=0; SameSite=Lax";
    window.location.assign("/login");
  }

  useEffect(() => {
    async function loadFolders() {
      setStatus("loading");

      try {
        const response = await fetch(`${apiUrl}/folders`, { headers: await authHeaders() });
        if (!response.ok) {
          throw new Error("Unable to load folders");
        }
        setFolders(await response.json());
        setStatus("idle");
      } catch {
        setStatus("error");
      }
    }

    loadFolders();
  }, []);

  async function toggleFolder(folderId: string) {
    const nextFolderId = expandedFolderId === folderId ? null : folderId;
    setExpandedFolderId(nextFolderId);

    if (!nextFolderId || folderNotes[folderId]) {
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/folders/${folderId}`, { headers: await authHeaders() });
      if (!response.ok) {
        throw new Error("Unable to load folder notes");
      }
      const detail = (await response.json()) as FolderDetail;
      setFolderNotes((current) => ({ ...current, [folderId]: detail.notes ?? [] }));
    } catch {
      setFolderNotes((current) => ({ ...current, [folderId]: [] }));
    }
  }

  return (
    <aside className="sticky top-0 flex h-screen min-h-screen flex-col border-r border-line bg-card/95 shadow-sm backdrop-blur">
      <div className="border-b border-line p-4">
        <Link href="/dashboard" className="flex items-center gap-3 rounded-md p-1 font-semibold transition hover:bg-mint/30 dark:hover:bg-mint/15">
          <span className="grid size-10 place-items-center rounded-md bg-coral text-white shadow-sm shadow-coral/20">
            <BookOpen size={19} />
          </span>
          <span>
            <span className="block leading-tight">Study Notes</span>
            <span className="block text-xs font-medium text-muted">AI lecture workspace</span>
          </span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <section className="space-y-1">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted">Main</p>
          {mainLinks.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition ${
                  isActive ? "bg-coral text-white shadow-sm shadow-coral/20" : "text-muted hover:bg-mint/40 hover:text-ink dark:hover:bg-mint/18"
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            );
          })}
          <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-line bg-paper/50 px-3 py-2">
            <span className="flex items-center gap-3 text-sm font-medium text-muted">
              <MoonStar size={16} />
              Dark mode
            </span>
            <ThemeToggle compact />
          </div>
          <button
            type="button"
            onClick={logout}
            className="mt-1 flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-muted transition hover:bg-mint/40 hover:text-ink dark:hover:bg-mint/18"
          >
            <LogOut size={16} />
            Log out
          </button>
        </section>

        <section className="mt-6 space-y-1">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted">Folders</p>
          {folders.map((folder) => {
            const isExpanded = expandedFolderId === folder.id;
            const notes = folderNotes[folder.id] ?? [];
            return (
              <div key={folder.id}>
                <button
                  type="button"
                  onClick={() => toggleFolder(folder.id)}
                  className="flex min-h-10 w-full items-center gap-2 rounded-md px-3 text-left text-sm font-medium text-muted transition hover:bg-mint/40 hover:text-ink dark:hover:bg-mint/18"
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
                          className={`flex min-h-9 items-center gap-2 rounded-md px-2 text-sm transition ${
                            pathname === `/notes/${note.id}`
                              ? "bg-coral/15 text-coral"
                              : "text-muted hover:bg-mint/40 hover:text-ink dark:hover:bg-mint/18"
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
      </div>
    </aside>
  );
}
