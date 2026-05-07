const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type Tone = "concise" | "detailed" | "exam_prep" | "beginner";

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}

export async function uploadPdf(folderId: string, file: File) {
  const formData = new FormData();
  formData.append("folder_id", folderId);
  formData.append("file", file);

  const response = await fetch(`${apiUrl}/documents/upload`, {
    method: "POST",
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document_id: documentId, tone })
  });

  if (!response.ok) {
    throw new Error("Note generation failed");
  }

  return response.json();
}

