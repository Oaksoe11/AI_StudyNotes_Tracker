"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ListChecks } from "lucide-react";

import { generateQuiz } from "@/lib/api";

type GenerateQuizButtonProps = {
  documentId?: string;
  noteId?: string;
  label?: string;
};

export function GenerateQuizButton({ documentId, noteId, label = "Generate quiz" }: GenerateQuizButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  async function handleGenerate() {
    setStatus("loading");
    setError("");

    try {
      const response = await generateQuiz({ document_id: documentId, note_id: noteId });
      router.push(`/quizzes/${response.quiz_id}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Quiz generation failed");
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={status === "loading"}
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-coral px-3 text-sm font-medium text-white shadow-sm transition hover:bg-berry disabled:opacity-60"
      >
        <ListChecks size={15} />
        {status === "loading" ? "Generating quiz" : label}
      </button>
      {status === "error" ? <p className="text-sm text-red-700 dark:text-red-300">{error}</p> : null}
    </div>
  );
}
