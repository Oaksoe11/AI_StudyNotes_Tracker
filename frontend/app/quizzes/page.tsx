import Link from "next/link";
import { ListChecks } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { QuizManageActions } from "@/components/QuizManageActions";
import { quizPath } from "@/lib/quiz-path";
import { serverApiGet } from "@/lib/server-api";

type Quiz = {
  id: string;
  title: string;
  created_at?: string;
  documents?: { title?: string; file_name?: string };
  folders?: { name?: string };
};

export default async function QuizzesPage() {
  let quizzes: Quiz[] = [];

  try {
    quizzes = await serverApiGet<Quiz[]>("/quizzes");
  } catch {
    quizzes = [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Quizzes</h1>
        <p className="mt-2 text-muted">Practice quizzes generated from your lecture PDFs.</p>
      </div>

      {quizzes.length ? (
        <div className="grid gap-3">
          {quizzes.map((quiz) => (
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
              <QuizManageActions quizId={quiz.id} title={quiz.title} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={<ListChecks size={20} />} title="No quizzes" description="Open a note or document and generate a practice quiz." />
      )}
    </div>
  );
}
