"use client";

import Link from "next/link";
import { BookOpen, Search } from "lucide-react";
import { useMemo, useState } from "react";

const pageSize = 12;

type Note = {
  id: string;
  title: string;
  tone: string;
  created_at?: string;
};

export function NotesList({ notes }: { notes: Note[] }) {
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const filteredNotes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return notes;
    }

    return notes.filter((note) => `${note.title} ${note.tone}`.toLowerCase().includes(normalizedQuery));
  }, [notes, query]);
  // Student note:
  // The browser renders fewer note cards at first, so opening the page feels quicker.
  const visibleNotes = filteredNotes.slice(0, visibleCount);
  const hasMoreNotes = visibleNotes.length < filteredNotes.length;

  return (
    <div className="space-y-3">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search notes"
          aria-label="Search notes"
          className="min-h-11 w-full rounded-md border border-line bg-card pl-10 pr-3 text-sm outline-none transition focus:border-coral"
        />
      </label>

      {filteredNotes.length ? (
        <div className="grid gap-3">
          {visibleNotes.map((note) => (
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
          {hasMoreNotes ? (
            <button
              type="button"
              onClick={() => setVisibleCount((count) => count + pageSize)}
              className="min-h-11 rounded-md border border-line bg-card px-4 text-sm font-medium text-muted transition hover:border-coral hover:text-coral"
            >
              Show more notes
            </button>
          ) : null}
        </div>
      ) : (
        <p className="rounded-md border border-line bg-card p-4 text-sm text-muted">No notes match your search.</p>
      )}
    </div>
  );
}
