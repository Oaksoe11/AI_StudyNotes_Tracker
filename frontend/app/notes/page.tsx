import Link from "next/link";
import { BookOpen } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { serverApiGet } from "@/lib/server-api";

type Note = {
  id: string;
  title: string;
  tone: string;
  created_at?: string;
};

export default async function NotesPage() {
  let notes: Note[] = [];

  try {
    notes = await serverApiGet<Note[]>("/notes");
  } catch {
    notes = [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Notes</h1>
        <p className="mt-2 text-muted">Generated lecture notes ready to review or edit.</p>
      </div>

      {notes.length ? (
        <div className="grid gap-3">
          {notes.map((note) => (
            <Link
              key={note.id}
              href={`/notes/${note.id}`}
              className="flex items-center justify-between gap-4 rounded-md border border-line bg-card p-4 shadow-sm transition hover:border-coral"
            >
              <span className="flex min-w-0 items-center gap-3">
                <BookOpen size={18} className="text-coral" />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{note.title}</span>
                  <span className="text-sm text-muted">{note.tone}</span>
                </span>
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState icon={<BookOpen size={20} />} title="No notes" description="Generate notes from an extracted PDF and they will appear here." />
      )}
    </div>
  );
}
