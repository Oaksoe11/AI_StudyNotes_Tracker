import { QuizRunner } from "@/components/QuizRunner";
import { serverApiGet } from "@/lib/server-api";

type QuizDetail = {
  quiz: {
    id: string;
    title: string;
    document_id?: string;
    documents?: { title?: string; file_name?: string };
    folders?: { name?: string };
  };
  questions: {
    id: string;
    level: "easy" | "medium" | "hard";
    question: string;
    choices: string[];
    correct_answer: string;
    explanation: string;
    page_reference?: string;
    position: number;
  }[];
};

export default async function QuizDetailPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await params;
  let data: QuizDetail;

  try {
    data = await serverApiGet<QuizDetail>(`/quizzes/${quizId}`);
  } catch {
    data = {
      quiz: { id: quizId, title: "Quiz not found" },
      questions: []
    };
  }

  return <QuizRunner quiz={data.quiz} questions={data.questions} />;
}
