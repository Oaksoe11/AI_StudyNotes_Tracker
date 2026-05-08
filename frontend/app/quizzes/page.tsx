import Link from "next/link";
import { ListChecks } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { serverApiGet } from "@/lib/server-api";

type Quiz = {
  id: string;
  title: string;
  created_at?: string;
  documents?: { title?: string; file_name?: string };
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
            <Link
              key={quiz.id}
              href={`/quizzes/${quiz.id}`}
              className="flex items-center justify-between gap-4 rounded-md border border-line bg-card p-4 shadow-sm transition hover:border-coral"
            >
              <span className="flex min-w-0 items-center gap-3">
                <ListChecks size={18} className="text-coral" />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{quiz.title}</span>
                  <span className="text-sm text-muted">{quiz.documents?.file_name || quiz.documents?.title || "Practice quiz"}</span>
                </span>
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState icon={<ListChecks size={20} />} title="No quizzes" description="Open a note or document and generate a practice quiz." />
      )}
    </div>
  );
}
