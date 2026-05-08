import { BookOpen } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { NotesList } from "@/components/NotesList";
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
        <NotesList notes={notes} />
      ) : (
        <EmptyState icon={<BookOpen size={20} />} title="No notes" description="Generate notes from an extracted PDF and they will appear here." />
      )}
    </div>
  );
}
