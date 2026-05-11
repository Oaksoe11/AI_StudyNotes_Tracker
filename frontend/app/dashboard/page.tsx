import Link from "next/link";
import type { ReactNode } from "react";
import { BookOpen, CircleAlert, FileText, FolderOpen, Plus, Upload, WandSparkles } from "lucide-react";

import { ActionCard } from "@/components/ActionCard";
import { EmptyState } from "@/components/EmptyState";
import { FolderForm } from "@/components/FolderForm";
import { StatusBadge } from "@/components/StatusBadge";
import { serverApiGet, serverFriendlyErrorMessage } from "@/lib/server-api";

type Folder = { id: string; name: string; created_at?: string };
type Document = { id: string; title?: string; file_name: string; status: string; created_at?: string };
type Note = { id: string; title: string; tone: string; created_at?: string };

async function getDashboardData() {
  try {
    const [folders, documents, notes] = await Promise.all([
      serverApiGet<Folder[]>("/folders"),
      serverApiGet<Document[]>("/documents"),
      serverApiGet<Note[]>("/notes")
    ]);

    return { folders, documents, notes, error: "" };
  } catch (error) {
    return {
      folders: [],
      documents: [],
      notes: [],
      error: serverFriendlyErrorMessage(error)
    };
  }
}

export default async function DashboardPage() {
  const { folders, documents, notes, error } = await getDashboardData();

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">Dashboard</h1>
          <p className="mt-2 text-muted">Folders, PDFs, and generated notes for your current study flow.</p>
        </div>
        <Link
          href="/folders"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-coral px-4 text-sm font-medium text-white shadow-sm transition hover:bg-berry"
        >
          <Plus size={16} />
          New folder
        </Link>
      </section>

      <FolderForm />

      {error ? (
        <EmptyState icon={<CircleAlert size={20} />} title="Could not load dashboard data" description={error} />
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <SummaryCard icon={<FolderOpen size={18} />} label="Folders" value={folders.length} />
            <SummaryCard icon={<FileText size={18} />} label="Documents" value={documents.length} />
            <SummaryCard icon={<BookOpen size={18} />} label="Notes" value={notes.length} />
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <ActionCard href="/folders" icon={<Plus size={18} />} title="Create folder" description="Start a course space for PDFs and notes." />
            <ActionCard href={folders[0] ? `/folders/${folders[0].id}` : "/folders"} icon={<Upload size={18} />} title="Upload PDF" description="Add a lecture deck to your first folder." />
            <ActionCard href={notes[0] ? `/notes/${notes[0].id}` : "/dashboard"} icon={<WandSparkles size={18} />} title="View notes" description="Jump into your most recent generated note." />
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <Panel title="Folders">
              {folders.map((folder) => (
                <Link key={folder.id} href={`/folders/${folder.id}`} className="block rounded-md border border-line p-3 hover:border-coral">
                  {folder.name}
                </Link>
              ))}
            </Panel>
            <Panel title="Recent uploads">
              {documents.slice(0, 5).map((document) => (
                <Link key={document.id} href={`/documents/${document.id}`} className="block rounded-md border border-line p-3 hover:border-coral">
                  <span className="block font-medium">{document.title || document.file_name}</span>
                  <span className="mt-2 block"><StatusBadge status={document.status} /></span>
                </Link>
              ))}
            </Panel>
            <Panel title="Recent notes">
              {notes.slice(0, 5).map((note) => (
                <Link key={note.id} href={`/notes/${note.id}`} className="block rounded-md border border-line p-3 hover:border-coral">
                  <span className="block font-medium">{note.title}</span>
                  <span className="text-sm text-muted">{note.tone}</span>
                </Link>
              ))}
            </Panel>
          </section>
        </>
      )}

      {!error && !folders.length ? (
        <EmptyState icon={<FolderOpen size={20} />} title="No dashboard activity yet" description="Create a course folder, upload a PDF, and generated notes will appear here." />
      ) : null}
    </div>
  );
}

function SummaryCard({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-md border border-line bg-card shadow-sm p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">{label}</span>
        <span className="text-coral">{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3 rounded-md border border-line bg-card shadow-sm p-4">
      <h2 className="font-semibold">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
