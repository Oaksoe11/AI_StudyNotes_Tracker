"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Check, Download, FileText, RefreshCw, Save, SquarePen, Trash2, X } from "lucide-react";

import { GenerateQuizButton } from "@/components/GenerateQuizButton";
import { apiDelete, generateNotes, Tone, updateNote } from "@/lib/api";

const tones: { value: Tone; label: string }[] = [
  { value: "concise", label: "Quick study notes" },
  { value: "detailed", label: "Full lecture notes" },
  { value: "exam_prep", label: "Exam prep" },
  { value: "beginner", label: "Explain like I'm new" }
];

type NoteWorkspaceProps = {
  note: {
    id: string;
    title: string;
    tone: Tone;
    content: string;
    created_at?: string;
    document_id?: string;
    folder_id?: string;
    documents?: { folder_id?: string; title?: string; file_name?: string };
  };
};

export function NoteWorkspace({ note }: NoteWorkspaceProps) {
  const router = useRouter();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [tone, setTone] = useState<Tone>(note.tone);
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "kept" | "deleting" | "regenerating" | "error">("idle");
  const [showReviewActions, setShowReviewActions] = useState(true);
  const folderId = note.folder_id ?? note.documents?.folder_id;
  const sourceFile = note.documents?.file_name || note.documents?.title;

  const createdDate = useMemo(() => {
    if (!note.created_at) {
      return "No date";
    }
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(note.created_at));
  }, [note.created_at]);

  async function handleSave() {
    setStatus("saving");

    try {
      await updateNote(note.id, { title, content });
      setStatus("saved");
      setIsEditing(false);
    } catch {
      setStatus("error");
    }
  }

  async function handleRegenerate() {
    if (!note.document_id) {
      setStatus("error");
      return;
    }

    setStatus("regenerating");

    try {
      const response = await generateNotes(note.document_id, tone);
      const next = response.note;
      setTitle(next.title);
      setContent(next.content);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  function handleKeep() {
    setShowReviewActions(false);
    setStatus("kept");
  }

  async function handleDeleteNote() {
    if (!window.confirm("Delete this generated note?")) {
      return;
    }

    setStatus("deleting");

    try {
      await apiDelete(`/notes/${note.id}`);
      router.push(folderId ? `/folders/${folderId}` : "/notes");
    } catch {
      setStatus("error");
    }
  }

  function handleExport() {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "lecture-note"}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <article className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-md bg-mint">
            <FileText size={20} />
          </span>
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-semibold tracking-normal sm:text-3xl">{title}</h1>
            <p className="mt-1 break-words text-sm text-muted sm:text-base">
              Tone: {tone} · Created {createdDate}
              {sourceFile ? ` · Source: ${sourceFile}` : ""}
            </p>
          </div>
        </div>
        <div className="grid gap-2 sm:flex sm:flex-wrap lg:justify-end">
          {folderId ? (
            <Link href={`/folders/${folderId}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-line px-3 text-sm font-medium hover:border-coral hover:text-coral">
              <ArrowLeft size={15} />
              Back to folder
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-line px-3 text-sm font-medium hover:border-coral hover:text-coral"
          >
            <SquarePen size={15} />
            Edit
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-line px-3 text-sm font-medium hover:border-coral hover:text-coral"
          >
            <Download size={15} />
            Export
          </button>
          {note.document_id ? <GenerateQuizButton noteId={note.id} label="Generate quiz" /> : null}
        </div>
      </div>

      {showReviewActions ? (
        <div className="flex flex-col justify-between gap-3 rounded-md border border-line bg-card p-4 shadow-sm md:flex-row md:items-center">
          <div>
            <h2 className="font-semibold">Keep this generated note?</h2>
            <p className="mt-1 text-sm text-muted">Save it in your notes, or discard it if this version is not useful.</p>
          </div>
          <div className="grid gap-2 sm:flex sm:flex-wrap">
            <button
              type="button"
              onClick={handleKeep}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-coral px-3 text-sm font-medium text-white shadow-sm transition hover:bg-berry"
            >
              <Check size={15} />
              Keep note
            </button>
            <button
              type="button"
              onClick={handleDeleteNote}
              disabled={status === "deleting"}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-red-400/40 px-3 text-sm font-medium text-red-600 transition hover:bg-red-500 hover:text-white disabled:opacity-60 dark:text-red-300"
            >
              <Trash2 size={15} />
              {status === "deleting" ? "Deleting" : "Delete note"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="rounded-md border border-line bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 text-sm font-medium">
            Regenerate tone
            <select
              value={tone}
              onChange={(event) => setTone(event.target.value as Tone)}
              className="mt-2 min-h-10 w-full rounded-md border border-line px-3 text-sm"
            >
              {tones.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={status === "regenerating"}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-coral px-4 text-sm font-medium text-white shadow-sm transition hover:bg-berry disabled:opacity-60"
          >
            <RefreshCw size={15} className={status === "regenerating" ? "animate-spin" : ""} />
            Regenerate
          </button>
        </div>
        {status === "saved" ? <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">Saved</p> : null}
        {status === "kept" ? <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">Note kept</p> : null}
        {status === "error" ? <p className="mt-3 text-sm text-red-700 dark:text-red-300">Action failed. Try again.</p> : null}
      </div>

      <div className="overflow-hidden rounded-md border border-line bg-card shadow-sm">
        {isEditing ? (
          <div className="space-y-4 p-5">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="min-h-11 w-full rounded-md border border-line px-3 text-sm outline-none focus:border-coral"
            />
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              className="min-h-[520px] w-full rounded-md border border-line px-3 py-3 font-mono text-sm leading-6 outline-none focus:border-coral"
            />
            <div className="grid gap-2 sm:flex sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setTitle(note.title);
                  setContent(note.content);
                  setIsEditing(false);
                }}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-line px-3 text-sm font-medium hover:border-coral"
              >
                <X size={15} />
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={status === "saving"}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-coral px-3 text-sm font-medium text-white shadow-sm transition hover:bg-berry disabled:opacity-60"
              >
                <Save size={15} />
                {status === "saving" ? "Saving" : "Save changes"}
              </button>
            </div>
          </div>
        ) : (
          <div className="max-h-[70vh] overflow-y-auto px-4 py-5 sm:px-5 md:px-8 md:py-6">
            <div className="note-markdown mx-auto max-w-3xl">
            <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
