import { CaptureFile } from "../core/recorder";

export async function submitCapture(args: {
  sessionToken: string;
  file: CaptureFile;
}): Promise<{ capture_id: string }> {
  const endpoint = process.env.EXPO_PUBLIC_SUBMIT_CAPTURE_URL;
  if (!endpoint) throw new Error("Missing EXPO_PUBLIC_SUBMIT_CAPTURE_URL");

  const form = new FormData();
  form.append("audio", {
    uri: args.file.uri,
    name: args.file.filename,
    type: args.file.mimeType,
  } as any);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${args.sessionToken}` },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Submit failed (${res.status}). ${text}`);
  }
  return await res.json();
}