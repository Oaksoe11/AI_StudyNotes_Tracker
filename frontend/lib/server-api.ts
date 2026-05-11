import { cookies } from "next/headers";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const requestTimeoutMs = 12000;

export class ServerApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ServerApiError";
    this.status = status;
  }
}

export function serverFriendlyErrorMessage(error: unknown): string {
  if (error instanceof ServerApiError) {
    return error.message;
  }

  if (error instanceof Error && error.name === "AbortError") {
    return "The backend is taking too long to respond. Please refresh in a moment.";
  }

  if (error instanceof TypeError) {
    return "The website cannot reach the backend right now. Make sure the API server is running.";
  }

  return "Could not load this page data. Please refresh and try again.";
}

async function serverResponseMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body.detail === "string" && body.detail) {
      return body.detail;
    }
  } catch {
    // The backend did not return JSON, so use a status-based message below.
  }

  if (response.status === 401) {
    return "Your login session expired. Please sign in again.";
  }

  if (response.status === 503) {
    return "The backend is missing configuration or is temporarily unavailable.";
  }

  if (response.status >= 500) {
    return "The backend had a problem loading this data. Please try again.";
  }

  return "Could not load this page data. Please refresh and try again.";
}

export async function serverApiGet<T>(path: string): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get("sb-access-token")?.value;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  const response = await fetch(`${apiUrl}${path}`, {
    cache: "no-store",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    signal: controller.signal
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    throw new ServerApiError(await serverResponseMessage(response), response.status);
  }

  return response.json();
}
