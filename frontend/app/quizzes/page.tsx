import { CircleAlert, ListChecks } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { QuizzesList } from "@/components/QuizzesList";
import { serverApiGet, serverFriendlyErrorMessage } from "@/lib/server-api";

type Quiz = {
  id: string;
  title: string;
  created_at?: string;
  documents?: { title?: string; file_name?: string };
  folders?: { name?: string };
};

export default async function QuizzesPage() {
  let quizzes: Quiz[] = [];
  let error = "";

  try {
    quizzes = await serverApiGet<Quiz[]>("/quizzes");
  } catch (caughtError) {
    quizzes = [];
    error = serverFriendlyErrorMessage(caughtError);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Quizzes</h1>
        <p className="mt-2 text-muted">Practice quizzes generated from your lecture PDFs.</p>
      </div>

      {error ? (
        <EmptyState icon={<CircleAlert size={20} />} title="Could not load quizzes" description={error} />
      ) : quizzes.length ? (
        <QuizzesList quizzes={quizzes} />
      ) : (
        <EmptyState icon={<ListChecks size={20} />} title="No quizzes" description="Open a note or document and generate a practice quiz." />
      )}
    </div>
  );
}
