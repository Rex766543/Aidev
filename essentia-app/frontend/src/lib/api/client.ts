/**
 * API クライアントのベース設定。
 * サーバーコンポーネント（SSR）からは INTERNAL_API_URL、
 * クライアントコンポーネントからは NEXT_PUBLIC_API_URL を使う。
 */

export function getApiBase(): string {
  if (typeof window === "undefined") {
    // サーバーサイド
    return (
      process.env.INTERNAL_API_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      "http://localhost:8000"
    );
  }
  // クライアントサイド
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const base = getApiBase();
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(detail?.detail ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}
