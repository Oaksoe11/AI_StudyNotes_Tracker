"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ListChecks } from "lucide-react";

import { friendlyErrorMessage, generateQuiz, QuizDifficulty } from "@/lib/api";

type GenerateQuizButtonProps = {
  // We can generate from a whole document...
  documentId?: string;
  // ...or from a specific generated note.
  noteId?: string;
  // Optional custom button text.
  label?: string;
};

export function GenerateQuizButton({ documentId, noteId, label = "Generate quiz" }: GenerateQuizButtonProps) {
  const router = useRouter();
  // The default is mixed so students get easy, medium, and hard questions.
  const [difficulty, setDifficulty] = useState<QuizDifficulty>("mixed");
  // If true, the quiz appears later on the quizzes page.
  const [saveQuiz, setSaveQuiz] = useState(true);
  // Track loading/error so the button can give feedback.
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  async function handleGenerate() {
    // Clear old errors before trying again.
    setStatus("loading");
    setError("");

    try {
      // Send the chosen difficulty and save option to the backend.
      const response = await generateQuiz({ document_id: documentId, note_id: noteId, difficulty, save_quiz: saveQuiz });
      // After the backend creates the quiz, open it right away.
      router.push(`/quizzes/${response.quiz_id}`);
    } catch (error) {
      setError(friendlyErrorMessage(error));
      setStatus("error");
    }
  }

  return (
    <div className="flex w-full flex-col gap-3 rounded-md border border-line bg-card p-3 shadow-sm sm:w-auto">
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
          // This checkbox lets students make a temporary practice quiz if they want.
          onChange={(event) => setSaveQuiz(event.target.checked)}
          className="size-4 rounded border-line"
        />
        Save this quiz for future practice
      </label>
      {status === "loading" ? (
        <p className="text-sm text-muted">AI quiz generation can take up to a couple minutes. Keep this page open.</p>
      ) : null}
      {status === "error" ? <p className="text-sm text-red-700 dark:text-red-300">{error}</p> : null}
    </div>
  );
}
