"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Save, Trash2, X } from "lucide-react";

import { apiDelete, apiPatch, friendlyErrorMessage } from "@/lib/api";

type QuizManageActionsProps = {
  quizId: string;
  title: string;
  redirectTo?: string;
  onDeleted?: () => void;
  onRenamed?: (title: string) => void;
};

export function QuizManageActions({ quizId, title, redirectTo, onDeleted, onRenamed }: QuizManageActionsProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [nextTitle, setNextTitle] = useState(title);
  const [status, setStatus] = useState<"idle" | "saving" | "deleting" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSave() {
    if (!nextTitle.trim()) {
      return;
    }

    setStatus("saving");
    setError("");

    try {
      const trimmedTitle = nextTitle.trim();
      await apiPatch(`/quizzes/${quizId}`, { title: trimmedTitle });
      // Student note:
      // Tell the parent list the new title so it can update without a full page refresh.
      onRenamed?.(trimmedTitle);
      setIsEditing(false);
      setStatus("idle");
      if (!onRenamed) {
        router.refresh();
      }
    } catch (error) {
      setError(friendlyErrorMessage(error));
      setStatus("error");
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete quiz "${title}"?`)) {
      return;
    }

    setStatus("deleting");
    setError("");

    try {
      await apiDelete(`/quizzes/${quizId}`);
      // Student note:
      // If a parent list gave us an optimistic delete callback, use it for instant feedback.
      onDeleted?.();
      if (redirectTo) {
        router.push(redirectTo);
      } else if (!onDeleted) {
        router.refresh();
      }
    } catch (error) {
      setError(friendlyErrorMessage(error));
      setStatus("error");
    }
  }

  if (isEditing) {
    return (
      <div className="grid min-w-0 gap-2 sm:flex sm:flex-row sm:items-center">
        <input
          value={nextTitle}
          onChange={(event) => setNextTitle(event.target.value)}
          className="min-h-10 min-w-0 rounded-md border border-line px-3 text-sm outline-none focus:border-coral"
        />
        <div className="grid grid-cols-[1fr_auto] gap-2 sm:flex">
          <button
            type="button"
            onClick={handleSave}
            disabled={status === "saving"}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-coral px-3 text-sm font-medium text-white disabled:opacity-60"
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
        {status === "error" ? <p className="text-sm text-red-700 dark:text-red-300">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:flex sm:flex-wrap">
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-line px-3 text-sm font-medium hover:border-coral hover:text-coral"
      >
        <Pencil size={15} />
        Rename
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={status === "deleting"}
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-red-400/40 px-3 text-sm font-medium text-red-600 transition hover:bg-red-500 hover:text-white disabled:opacity-60 dark:text-red-300"
      >
        <Trash2 size={15} />
        {status === "deleting" ? "Deleting" : "Delete"}
      </button>
      {status === "error" ? <p className="text-sm text-red-700 dark:text-red-300">{error}</p> : null}
    </div>
  );
}
