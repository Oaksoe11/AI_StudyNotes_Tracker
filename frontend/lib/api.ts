import { getSupabaseClient } from "@/lib/supabase";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const requestTimeoutMs = 30000;
// Student note:
// AI requests are slower than normal button clicks because Gemini has to think and write.
// Give AI calls more time so users do not see a fake "server is slow" error while notes are still being made.
const aiRequestTimeoutMs = 180000;

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// Student note:
// Users should never see scary low-level errors like "Failed to fetch".
// This helper converts network/status problems into messages that explain what to do next.
export function friendlyErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return "This is taking longer than usual. Please wait a moment, then refresh the page to check whether it finished.";
  }

  if (error instanceof TypeError) {
    return "The app cannot reach the backend right now. Check that the server is running, then refresh.";
  }

  if (error instanceof Error) {
    return error.message || "Something went wrong. Please try again.";
  }

  return "Something went wrong. Please try again.";
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = requestTimeoutMs) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}

async function responseMessage(response: Response, fallback: string): Promise<string> {
  let detail = "";

  try {
    const body = await response.json();
    detail = typeof body.detail === "string" ? body.detail : "";
  } catch {
    // Keep using the fallback if the backend did not return JSON.
  }

  if (detail) {
    return detail;
  }

  if (response.status === 401) {
    return "Your login session expired. Please sign in again.";
  }

  if (response.status === 429) {
    return "The AI service is busy or at its limit. Please wait a minute and try again.";
  }

  if (response.status === 502) {
    return "The AI service could not finish this request. Please try again shortly.";
  }

  if (response.status === 503) {
    return "The backend is not fully configured or is temporarily unavailable.";
  }

  if (response.status >= 500) {
    return "The server had a problem. Please try again, or refresh the page.";
  }

  return fallback;
}

async function ensureOk(response: Response, fallback: string): Promise<void> {
  if (!response.ok) {
    throw new ApiError(await responseMessage(response, fallback), response.status);
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  if (typeof window === "undefined") {
    return {};
  }

  const supabase = getSupabaseClient();

  if (!supabase) {
    return {};
  }

  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type Tone = "concise" | "detailed" | "exam_prep" | "beginner";

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetchWithTimeout(`${apiUrl}${path}`, {
    cache: "no-store",
    headers: await getAuthHeaders()
  });

  await ensureOk(response, "Could not load this information. Please refresh and try again.");

  return response.json();
}

export async function apiPost<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetchWithTimeout(`${apiUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
    body: JSON.stringify(payload)
  });

  await ensureOk(response, "Could not save this. Please check your connection and try again.");

  return response.json();
}

export async function apiDelete<T>(path: string): Promise<T> {
  const response = await fetchWithTimeout(`${apiUrl}${path}`, {
    method: "DELETE",
    headers: await getAuthHeaders()
  });

  await ensureOk(response, "Could not delete this item. Please try again.");

  return response.json();
}

export async function apiPatch<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetchWithTimeout(`${apiUrl}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
    body: JSON.stringify(payload)
  });

  await ensureOk(response, "Could not update this item. Please try again.");

  return response.json();
}

export async function uploadPdf(folderId: string, tone: Tone, file: File): Promise<{ document_id: string }> {
  const formData = new FormData();
  formData.append("folder_id", folderId);
  formData.append("tone", tone);
  formData.append("file", file);

  const response = await fetchWithTimeout(`${apiUrl}/documents/upload`, {
    method: "POST",
    headers: await getAuthHeaders(),
    body: formData
  });

  await ensureOk(response, "Upload failed. Please choose a valid PDF and try again.");

  return response.json();
}

export async function generateNotes(documentId: string, tone: Tone) {
  const response = await fetchWithTimeout(`${apiUrl}/notes/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
    body: JSON.stringify({ document_id: documentId, tone })
  }, aiRequestTimeoutMs);

  await ensureOk(response, "Note generation failed. Please try again shortly.");

  return response.json() as Promise<{ note_id: string; note: { title: string; content: string } }>;
}

export async function updateNote(noteId: string, payload: { title?: string; content?: string }) {
  const response = await fetchWithTimeout(`${apiUrl}/notes/${noteId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
    body: JSON.stringify(payload)
  });

  await ensureOk(response, "Could not save the note. Please try again.");

  return response.json();
}

export async function extractDocument(documentId: string) {
  const response = await fetchWithTimeout(`${apiUrl}/documents/${documentId}/extract`, {
    method: "POST",
    headers: await getAuthHeaders()
  });

  await ensureOk(response, "PDF extraction failed. Please try a smaller or clearer PDF.");

  return response.json();
}

export type QuizDifficulty = "mixed" | "easy" | "medium" | "hard";

export async function generateQuiz(payload: { document_id?: string; note_id?: string; difficulty?: QuizDifficulty; save_quiz?: boolean }) {
  const response = await fetchWithTimeout(`${apiUrl}/quizzes/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
    body: JSON.stringify(payload)
  }, aiRequestTimeoutMs);

  await ensureOk(response, "Quiz generation failed. Please try again shortly.");

  return response.json() as Promise<{ quiz_id: string }>;
}
