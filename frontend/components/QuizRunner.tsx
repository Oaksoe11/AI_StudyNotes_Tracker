"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, CircleAlert } from "lucide-react";

import { QuizManageActions } from "@/components/QuizManageActions";
import { quizPath } from "@/lib/quiz-path";

type Quiz = {
  id: string;
  title: string;
  document_id?: string;
  documents?: { title?: string; file_name?: string };
  folders?: { name?: string };
};

type Question = {
  id: string;
  level: "easy" | "medium" | "hard";
  question: string;
  choices: string[];
  correct_answer: string;
  explanation: string;
  page_reference?: string;
  position: number;
};

const levelLabels = {
  // These labels turn database values into nicer UI text.
  easy: "Easy",
  medium: "Medium",
  hard: "Hard"
};

export function QuizRunner({ quiz, questions }: { quiz: Quiz; questions: Question[] }) {
  // answers is an object like { questionId: "Selected answer" }.
  const [answers, setAnswers] = useState<Record<string, string>>({});
  // submitted becomes true after the student finishes the quiz.
  const [submitted, setSubmitted] = useState(false);
  // Calculate score from the selected answers.
  // useMemo means React only recalculates when answers/questions change.
  const score = useMemo(
    () => questions.filter((question) => answers[question.id] === question.correct_answer).length,
    [answers, questions]
  );
  // Example path: CMPT 300/lecture-1/my quiz.
  const path = quizPath(quiz);

  function selectAnswer(questionId: string, choice: string) {
    // After submission, answers should be locked.
    if (submitted) {
      return;
    }
    // Keep all old answers, then replace the answer for this one question.
    setAnswers((current) => ({ ...current, [questionId]: choice }));
  }

  return (
    <article className="space-y-6">
      <Link href="/notes" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-coral">
        <ArrowLeft size={16} />
        Back to notes
      </Link>

      <header className="flex flex-col justify-between gap-4 rounded-md border border-line bg-card p-4 shadow-sm sm:p-5 lg:flex-row lg:items-start">
        <div className="min-w-0">
          <p className="text-sm font-medium text-coral">Practice quiz</p>
          <h1 className="mt-1 break-words text-2xl font-semibold tracking-normal sm:text-3xl">{quiz.title}</h1>
          <p className="mt-2 text-muted">15 questions across easy, medium, and hard levels</p>
          <p className="mt-2 break-all font-mono text-xs text-muted">{path}</p>
        </div>
        <QuizManageActions quizId={quiz.id} title={quiz.title} redirectTo="/quizzes" />
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        {(["easy", "medium", "hard"] as const).map((level) => (
          // Small summary cards show how many questions are in each difficulty.
          <div key={level} className="rounded-md border border-line bg-card p-4 shadow-sm">
            <p className="text-sm text-muted">{levelLabels[level]}</p>
            <p className="mt-2 text-2xl font-semibold">{questions.filter((question) => question.level === level).length}</p>
          </div>
        ))}
      </section>

      <div className="space-y-4">
        {questions.map((question) => {
          // selected is undefined until the user chooses one answer.
          const selected = answers[question.id];
          // This is used after submitting to show correct/wrong feedback.
          const isCorrect = selected === question.correct_answer;

          return (
            <section key={question.id} className="rounded-md border border-line bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-line px-2 py-1 text-xs font-medium text-muted">
                  {levelLabels[question.level]}
                </span>
                {question.page_reference ? <span className="text-xs text-muted">{question.page_reference}</span> : null}
              </div>
              <h2 className="mt-3 break-words font-semibold">{question.position}. {question.question}</h2>
              <div className="mt-3 grid gap-2">
                {question.choices.map((choice) => {
                  // These booleans decide how each answer button should be colored.
                  const isSelected = selected === choice;
                  const showCorrect = submitted && choice === question.correct_answer;
                  const showWrong = submitted && isSelected && !showCorrect;

                  return (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => selectAnswer(question.id, choice)}
                      className={`min-h-11 rounded-md border px-3 text-left text-sm transition ${
                        showCorrect
                          ? "border-emerald-400 bg-emerald-400/12 text-emerald-700 dark:text-emerald-300"
                          : showWrong
                            ? "border-red-400 bg-red-400/12 text-red-700 dark:text-red-300"
                            : isSelected
                              ? "border-coral bg-coral/10"
                              : "border-line hover:border-coral"
                      }`}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>
              {submitted ? (
                <div className="mt-3 flex gap-2 rounded-md border border-line bg-paper/60 p-3 text-sm">
                  {isCorrect ? <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-600" /> : <CircleAlert size={17} className="mt-0.5 shrink-0 text-red-600" />}
                  <p className="min-w-0 break-words">
                    <span className="font-medium">{isCorrect ? "Correct." : `Answer: ${question.correct_answer}.`}</span>{" "}
                    {question.explanation}
                  </p>
                </div>
              ) : null}
            </section>
          );
        })}
      </div>

      <div className="sticky bottom-4 flex flex-col gap-3 rounded-md border border-line bg-card/95 p-4 shadow-lg backdrop-blur md:flex-row md:items-center md:justify-between">
        <p className="font-medium">
          {/* Before submit, show progress. After submit, show the final score. */}
          {submitted ? `Score: ${score}/${questions.length}` : `${Object.keys(answers).length}/${questions.length} answered`}
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(true)}
          disabled={submitted || Object.keys(answers).length < questions.length}
          className="inline-flex min-h-10 items-center justify-center rounded-md bg-coral px-4 text-sm font-medium text-white shadow-sm transition hover:bg-berry disabled:opacity-60"
        >
          {submitted ? "Submitted" : "Submit quiz"}
        </button>
      </div>
    </article>
  );
}
