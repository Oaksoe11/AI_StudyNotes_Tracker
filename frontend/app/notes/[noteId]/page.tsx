import ReactMarkdown from "react-markdown";
import { BookOpen } from "lucide-react";

import { apiGet } from "@/lib/api";

type Note = {
  id: string;
  title: string;
  tone: string;
  content: string;
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

  return (
    <article className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-md bg-mint">
          <BookOpen size={20} />
        </span>
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">{note.title}</h1>
          <p className="text-muted">Tone: {note.tone}</p>
        </div>
      </div>

      <div className="rounded-md border border-line bg-card shadow-sm p-6">
        <div className="prose max-w-none prose-neutral dark:prose-invert">
          <ReactMarkdown>{note.content}</ReactMarkdown>
        </div>
      </div>
    </article>
  );
}

