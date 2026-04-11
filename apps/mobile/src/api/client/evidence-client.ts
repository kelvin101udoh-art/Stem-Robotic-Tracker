import type { SubmitEvidenceResponse, EvidenceMetadataDto } from "@stemtrack/sdk";

export async function submitEvidence(args: {
  endpoint: string;
  sessionToken: string;
  file: {
    uri: string;
    name: string;
    type: string;
  };
  metadata: EvidenceMetadataDto;
}): Promise<SubmitEvidenceResponse> {
  const form = new FormData();

  form.append("file", args.file as any);
  form.append("metadata", JSON.stringify(args.metadata));

  const response = await fetch(args.endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.sessionToken}`,
    },
    body: form,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Evidence upload failed (${response.status}). ${text}`);
  }

  return (await response.json()) as SubmitEvidenceResponse;
}