export async function http<T>(
  url: string,
  init: RequestInit,
  timeoutMs = 30_000
): Promise<T> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Request failed (${res.status}). ${text}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(id);
  }
}