import { cookies } from "next/headers";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function serverApiGet<T>(path: string): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get("sb-access-token")?.value;
  const response = await fetch(`${apiUrl}${path}`, {
    cache: "no-store",
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}
