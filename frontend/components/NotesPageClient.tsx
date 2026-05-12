"use client";

import { useEffect, useState } from "react";
import { BookOpen, CircleAlert } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { NotesList } from "@/components/NotesList";
import { apiGet, friendlyErrorMessage } from "@/lib/api";

type Note = {
  id: string;
  title: string;
  tone: string;
  created_at?: string;
};

type NotesPageClientProps = {
  initialNotes: Note[];
  initialError: string;
};

export function NotesPageClient({ initialNotes, initialError }: NotesPageClientProps) {
  // Student note:
  // The server renders the first version, then the browser refreshes the list once.
  // This fixes stale navigation cache after generating/keeping a new note.
  const [notes, setNotes] = useState(initialNotes);
  const [error, setError] = useState(initialError);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadLatestNotes() {
      setIsRefreshing(true);
      try {
        const latestNotes = await apiGet<Note[]>("/notes");
        if (!isMounted) {
          return;
        }
        setNotes(latestNotes);
        setError("");
      } catch (caughtError) {
        if (!isMounted) {
          return;
        }
        // Keep any notes we already had, but show a friendlier message if the refresh failed.
        setError(friendlyErrorMessage(caughtError));
      } finally {
        if (isMounted) {
          setIsRefreshing(false);
        }
      }
    }

    loadLatestNotes();

    return () => {
      isMounted = false;
    };
  }, []);

  if (error && !notes.length) {
    return <EmptyState icon={<CircleAlert size={20} />} title="Notes are still loading" description={error} />;
  }

  if (notes.length) {
    return (
      <div className="space-y-3">
        {isRefreshing ? <p className="text-sm text-muted">Checking for new notes...</p> : null}
        {error ? <p className="rounded-md border border-line bg-card p-3 text-sm text-muted">Could not refresh yet. Showing the last notes we found.</p> : null}
        <NotesList notes={notes} />
      </div>
    );
  }

  return (
    <EmptyState
      icon={<BookOpen size={20} />}
      title={isRefreshing ? "Checking for notes" : "No notes"}
      description={isRefreshing ? "Looking for newly generated notes..." : "Generate notes from an extracted PDF and they will appear here."}
    />
  );
}
