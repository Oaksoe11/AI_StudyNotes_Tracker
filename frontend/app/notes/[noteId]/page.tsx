import { NoteWorkspace } from "@/components/NoteWorkspace";
import { serverApiGet } from "@/lib/server-api";

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
  let note: Note;

  try {
    note = await serverApiGet<Note>(`/notes/${noteId}`);
  } catch {
    note = {
      id: noteId,
      title: "Note not found",
      tone: "concise",
      content: "This note could not be loaded for the current signed-in user."
    };
  }

  return <NoteWorkspace note={note as Parameters<typeof NoteWorkspace>[0]["note"]} />;
}
