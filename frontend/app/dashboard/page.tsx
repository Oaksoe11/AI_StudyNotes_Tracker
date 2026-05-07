import Link from "next/link";
import type { ReactNode } from "react";
import { BookOpen, FileText, FolderOpen, Plus } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { FolderForm } from "@/components/FolderForm";
import { apiGet } from "@/lib/api";

type Folder = { id: string; name: string; created_at?: string };
type Document = { id: string; file_name: string; status: string };
type Note = { id: string; title: string; tone: string };

async function getDashboardData() {
  try {
    const [folders, documents, notes] = await Promise.all([
      apiGet<Folder[]>("/folders"),
      apiGet<Document[]>("/documents"),
      apiGet<Note[]>("/notes")
    ]);

    return { folders, documents, notes };
  } catch {
    return {
      folders: [{ id: "demo", name: "CMPT 300" }],
      documents: [{ id: "demo", file_name: "Lecture 01.pdf", status: "uploaded" }],
      notes: [{ id: "demo", title: "Lecture 01 Notes", tone: "concise" }]
    };
  }
}

export default async function DashboardPage() {
  const { folders, documents, notes } = await getDashboardData();

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

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard icon={<FolderOpen size={18} />} label="Folders" value={folders.length} />
        <SummaryCard icon={<FileText size={18} />} label="Documents" value={documents.length} />
        <SummaryCard icon={<BookOpen size={18} />} label="Notes" value={notes.length} />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Panel title="Folders">
          {folders.map((folder) => (
            <Link key={folder.id} href={`/folders/${folder.id}`} className="block rounded-md border border-line p-3 hover:border-coral">
              {folder.name}
            </Link>
          ))}
        </Panel>
        <Panel title="Recent documents">
          {documents.map((document) => (
            <Link key={document.id} href={`/documents/${document.id}`} className="block rounded-md border border-line p-3 hover:border-coral">
              <span className="block font-medium">{document.file_name}</span>
              <span className="text-sm text-muted">{document.status}</span>
            </Link>
          ))}
        </Panel>
        <Panel title="Recent notes">
          {notes.map((note) => (
            <Link key={note.id} href={`/notes/${note.id}`} className="block rounded-md border border-line p-3 hover:border-coral">
              <span className="block font-medium">{note.title}</span>
              <span className="text-sm text-muted">{note.tone}</span>
            </Link>
          ))}
        </Panel>
      </section>

      {!folders.length ? (
        <EmptyState icon={<FolderOpen size={20} />} title="No folders yet" description="Create a course folder to start uploading lecture PDFs." />
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
