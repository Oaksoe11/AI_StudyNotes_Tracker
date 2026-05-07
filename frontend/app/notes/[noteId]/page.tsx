import { NoteWorkspace } from "@/components/NoteWorkspace";
import { apiGet } from "@/lib/api";

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
    note = await apiGet<Note>(`/notes/${noteId}`);
  } catch {
    note = {
      id: noteId,
      title: "Lecture 01 Notes",
      tone: "concise",
      content: "# Lecture 01 Notes\n\n## Key concepts\n\n- Upload a lecture PDF.\n- Extract text and slide images.\n- Generate notes with a selected tone.\n\n## Review checklist\n\n- Can you explain the main topic?\n- Can you identify the important definitions?"
    };
  }

  return <NoteWorkspace note={note as Parameters<typeof NoteWorkspace>[0]["note"]} />;
}
