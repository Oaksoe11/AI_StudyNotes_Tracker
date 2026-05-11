"use client";

import Link from "next/link";
import { ListChecks } from "lucide-react";
import { useState } from "react";

import { QuizManageActions } from "@/components/QuizManageActions";
import { quizPath } from "@/lib/quiz-path";

const pageSize = 12;

type Quiz = {
  id: string;
  title: string;
  created_at?: string;
  documents?: { title?: string; file_name?: string };
  folders?: { name?: string };
};

type QuizzesListProps = {
  quizzes: Quiz[];
};

export function QuizzesList({ quizzes }: QuizzesListProps) {
  // Student note:
  // Keep a local copy so a deleted quiz disappears instantly instead of waiting for a page refresh.
  const [items, setItems] = useState(quizzes);
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const visibleQuizzes = items.slice(0, visibleCount);
  const hasMoreQuizzes = visibleQuizzes.length < items.length;

  return (
    <div className="grid gap-3">
      {visibleQuizzes.map((quiz) => (
        <div
          key={quiz.id}
          className="flex flex-col justify-between gap-4 rounded-md border border-line bg-card p-4 shadow-sm transition hover:border-coral md:flex-row md:items-center"
        >
          <Link href={`/quizzes/${quiz.id}`} className="flex min-w-0 items-center gap-3 hover:text-coral">
            <ListChecks size={18} className="shrink-0 text-coral" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{quiz.title}</span>
              <span className="block truncate font-mono text-xs text-muted">{quizPath(quiz)}</span>
            </span>
          </Link>
          <QuizManageActions
            quizId={quiz.id}
            title={quiz.title}
            onDeleted={() => {
              // Student note:
              // This is optimistic UI. The delete already succeeded, so remove it from the screen now.
              setItems((current) => current.filter((item) => item.id !== quiz.id));
            }}
            onRenamed={(nextTitle) => {
              // Student note:
              // Rename locally too, so the user sees the new title right away.
              setItems((current) => current.map((item) => (item.id === quiz.id ? { ...item, title: nextTitle } : item)));
            }}
          />
        </div>
      ))}

      {hasMoreQuizzes ? (
        <button
          type="button"
          onClick={() => setVisibleCount((count) => count + pageSize)}
          className="min-h-11 rounded-md border border-line bg-card px-4 text-sm font-medium text-muted transition hover:border-coral hover:text-coral"
        >
          Show more quizzes
        </button>
      ) : null}
    </div>
  );
}
