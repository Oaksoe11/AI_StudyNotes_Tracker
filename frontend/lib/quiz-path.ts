export type QuizPathParts = {
  title: string;
  documents?: { title?: string; file_name?: string };
  folders?: { name?: string };
};

export function quizPath(quiz: QuizPathParts) {
  const folderName = quiz.folders?.name || "Unfiled";
  const lectureName = quiz.documents?.title || quiz.documents?.file_name || "Lecture";
  return `${folderName}/${lectureName}/${quiz.title}`;
}
