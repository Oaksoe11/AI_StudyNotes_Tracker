"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Save, Trash2, X } from "lucide-react";

import { apiDelete, apiPatch } from "@/lib/api";

type QuizManageActionsProps = {
  quizId: string;
  title: string;
  redirectTo?: string;
};

export function QuizManageActions({ quizId, title, redirectTo }: QuizManageActionsProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [nextTitle, setNextTitle] = useState(title);
  const [status, setStatus] = useState<"idle" | "saving" | "deleting" | "error">("idle");

  async function handleSave() {
    if (!nextTitle.trim()) {
      return;
    }

    setStatus("saving");

    try {
      await apiPatch(`/quizzes/${quizId}`, { title: nextTitle.trim() });
      setIsEditing(false);
      setStatus("idle");
      router.refresh();
    } catch {
      setStatus("error");
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete quiz "${title}"?`)) {
      return;
    }

    setStatus("deleting");

    try {
      await apiDelete(`/quizzes/${quizId}`);
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    } catch {
      setStatus("error");
    }
  }

  if (isEditing) {
    return (
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
        <input
          value={nextTitle}
          onChange={(event) => setNextTitle(event.target.value)}
          className="min-h-10 min-w-0 rounded-md border border-line px-3 text-sm outline-none focus:border-coral"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={status === "saving"}
            className="inline-flex min-h-10 items-center gap-2 rounded-md bg-coral px-3 text-sm font-medium text-white disabled:opacity-60"
          >
            <Save size={15} />
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setNextTitle(title);
              setIsEditing(false);
            }}
            className="grid size-10 place-items-center rounded-md border border-line hover:border-coral hover:text-coral"
            title="Cancel rename"
          >
            <X size={15} />
          </button>
        </div>
        {status === "error" ? <p className="text-sm text-red-700 dark:text-red-300">Could not update quiz.</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="inline-flex min-h-10 items-center gap-2 rounded-md border border-line px-3 text-sm font-medium hover:border-coral hover:text-coral"
      >
        <Pencil size={15} />
        Rename
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={status === "deleting"}
        className="inline-flex min-h-10 items-center gap-2 rounded-md border border-red-400/40 px-3 text-sm font-medium text-red-600 transition hover:bg-red-500 hover:text-white disabled:opacity-60 dark:text-red-300"
      >
        <Trash2 size={15} />
        {status === "deleting" ? "Deleting" : "Delete"}
      </button>
    </div>
  );
}
