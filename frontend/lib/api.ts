const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function getAuthHeaders(): Promise<Record<string, string>> {
  if (typeof window === "undefined") {
    return {};
  }

  const { getSupabaseClient } = await import("@/lib/supabase");
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
  const response = await fetch(`${apiUrl}${path}`, {
    cache: "no-store",
    headers: await getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}

export async function apiPost<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}

export async function apiDelete<T>(path: string): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    method: "DELETE",
    headers: await getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}

export async function uploadPdf(folderId: string, tone: Tone, file: File): Promise<{ document_id: string }> {
  const formData = new FormData();
  formData.append("folder_id", folderId);
  formData.append("tone", tone);
  formData.append("file", file);

  const response = await fetch(`${apiUrl}/documents/upload`, {
    method: "POST",
    headers: await getAuthHeaders(),
    body: formData
  });

  if (!response.ok) {
    throw new Error("Upload failed");
  }

  return response.json();
}

export async function generateNotes(documentId: string, tone: Tone) {
  const response = await fetch(`${apiUrl}/notes/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
    body: JSON.stringify({ document_id: documentId, tone })
  });

  if (!response.ok) {
    let message = "Note generation failed";
    try {
      const body = await response.json();
      message = body.detail || message;
    } catch {
      // Keep the default message if the server did not return JSON.
    }
    throw new Error(message);
  }

  return response.json() as Promise<{ note_id: string; note: { title: string; content: string } }>;
}

export async function updateNote(noteId: string, payload: { title?: string; content?: string }) {
  const response = await fetch(`${apiUrl}/notes/${noteId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Note update failed");
  }

  return response.json();
}

export async function extractDocument(documentId: string) {
  const response = await fetch(`${apiUrl}/documents/${documentId}/extract`, {
    method: "POST",
    headers: await getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error("PDF extraction failed");
  }

  return response.json();
}
