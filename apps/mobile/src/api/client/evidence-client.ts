// apps/mobile/src/api/client/evidence-client.ts
import type {
  EvidenceMetadata,
  IngestEvidenceResponseDTO,
  TrackBranch,
} from "stemtrack-sdk";

export async function submitBranchEvidence(args: {
  endpoint: string;
  sessionToken: string;
  sessionId: string;
  organizationId: string;
  branch: TrackBranch;
  taggedStudentIds: string[];
  manualNote?: string;
  file?: {
    uri: string;
    name: string;
    type: string;
  };
  metadata: EvidenceMetadata;
}): Promise<IngestEvidenceResponseDTO> {
  const form = new FormData();

  if (args.file) {
    form.append("file", args.file as unknown as Blob);
  }

  form.append("sessionId", args.sessionId);
  form.append("organizationId", args.organizationId);
  form.append("branch", args.branch);
  form.append("taggedStudentIds", JSON.stringify(args.taggedStudentIds));
  if (args.manualNote !== undefined) {
    form.append("manualNote", args.manualNote);
  }
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

  return (await response.json()) as IngestEvidenceResponseDTO;
}