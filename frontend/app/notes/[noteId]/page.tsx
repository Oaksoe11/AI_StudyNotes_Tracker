import Link from "next/link";
import { CircleAlert } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { NoteWorkspace } from "@/components/NoteWorkspace";
import { serverApiGet, serverFriendlyErrorMessage } from "@/lib/server-api";

type Note = {
  id: string;
  title: string;
  tone: string;
  content: string;
  created_at?: string;
  document_id?: string;
  documents?: { folder_id?: string; title?: string; file_name?: string };
};

export default async function NoteDetailPage({ params }: { params: Promise<{ noteId: string }> }) {
  const { noteId } = await params;
  let note: Note | null = null;
  let error = "";

  try {
    note = await serverApiGet<Note>(`/notes/${noteId}`);
  } catch (caughtError) {
    error = serverFriendlyErrorMessage(caughtError);
  }

  if (!note) {
    return (
      <div className="space-y-6">
        <Link href="/notes" className="text-sm font-medium text-muted hover:text-coral">
          Back to notes
        </Link>
        <EmptyState icon={<CircleAlert size={20} />} title="Could not load note" description={error} />
      </div>
    );
  }

  return <NoteWorkspace note={note as Parameters<typeof NoteWorkspace>[0]["note"]} />;
}
