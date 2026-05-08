"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ListChecks } from "lucide-react";

import { generateQuiz, QuizDifficulty } from "@/lib/api";

type GenerateQuizButtonProps = {
  documentId?: string;
  noteId?: string;
  label?: string;
};

export function GenerateQuizButton({ documentId, noteId, label = "Generate quiz" }: GenerateQuizButtonProps) {
  const router = useRouter();
  const [difficulty, setDifficulty] = useState<QuizDifficulty>("mixed");
  const [saveQuiz, setSaveQuiz] = useState(true);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  async function handleGenerate() {
    setStatus("loading");
    setError("");

    try {
      const response = await generateQuiz({ document_id: documentId, note_id: noteId, difficulty, save_quiz: saveQuiz });
      router.push(`/quizzes/${response.quiz_id}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Quiz generation failed");
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-line bg-card p-3 shadow-sm">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="text-sm font-medium">
          Quiz level
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value as QuizDifficulty)}
            className="mt-1 min-h-10 w-full rounded-md border border-line px-3 text-sm"
          >
            <option value="mixed">Mixed levels</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={status === "loading"}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-coral px-3 text-sm font-medium text-white shadow-sm transition hover:bg-berry disabled:opacity-60"
        >
          <ListChecks size={15} />
          {status === "loading" ? "Generating" : label}
        </button>
      </div>
      <label className="flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={saveQuiz}
          onChange={(event) => setSaveQuiz(event.target.checked)}
          className="size-4 rounded border-line"
        />
        Save this quiz for future practice
      </label>
      {status === "error" ? <p className="text-sm text-red-700 dark:text-red-300">{error}</p> : null}
    </div>
  );
}
