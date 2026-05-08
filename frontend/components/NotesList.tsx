"use client";

import Link from "next/link";
import { BookOpen, Search } from "lucide-react";
import { useMemo, useState } from "react";

type Note = {
  id: string;
  title: string;
  tone: string;
  created_at?: string;
};

export function NotesList({ notes }: { notes: Note[] }) {
  const [query, setQuery] = useState("");
  const filteredNotes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return notes;
    }

    return notes.filter((note) => `${note.title} ${note.tone}`.toLowerCase().includes(normalizedQuery));
  }, [notes, query]);

  return (
    <div className="space-y-3">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search notes"
          className="min-h-11 w-full rounded-md border border-line bg-card pl-10 pr-3 text-sm outline-none transition focus:border-coral"
        />
      </label>

      {filteredNotes.length ? (
        <div className="grid gap-3">
          {filteredNotes.map((note) => (
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
        <p className="rounded-md border border-line bg-card p-4 text-sm text-muted">No notes match your search.</p>
      )}
    </div>
  );
}
