import type { SubmitLearningCaptureResponse } from "@stemtrack/sdk";
import type { CaptureFile } from "../../core/recorder";

export async function submitLearningCapture(args: {
  sessionToken: string;
  file: CaptureFile;
}): Promise<SubmitLearningCaptureResponse> {
  const endpoint = process.env.EXPO_PUBLIC_SUBMIT_CAPTURE_URL;
  if (!endpoint) {
    throw new Error("Missing EXPO_PUBLIC_SUBMIT_CAPTURE_URL");
  }

  const form = new FormData();
  form.append(
    "audio",
    {
      uri: args.file.uri,
      name: args.file.filename,
      type: args.file.mimeType,
    } as any
  );

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.sessionToken}`,
    },
    body: form,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Submit failed (${response.status}). ${text}`);
  }

  return (await response.json()) as SubmitLearningCaptureResponse;
}