import { NotesPageClient } from "@/components/NotesPageClient";
import { serverApiGet, serverFriendlyErrorMessage } from "@/lib/server-api";

type Note = {
  id: string;
  title: string;
  tone: string;
  created_at?: string;
};

export default async function NotesPage() {
  let notes: Note[] = [];
  let error = "";

  try {
    notes = await serverApiGet<Note[]>("/notes");
  } catch (caughtError) {
    notes = [];
    error = serverFriendlyErrorMessage(caughtError);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Notes</h1>
        <p className="mt-2 text-muted">Generated lecture notes ready to review or edit.</p>
      </div>

      <NotesPageClient initialNotes={notes} initialError={error} />
    </div>
  );
}
