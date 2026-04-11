import { http } from "../http";
import type {
  SubmitAttendanceRequest,
  SubmitAttendanceResponse,
} from "@stemtrack/sdk";

export async function submitAttendance(args: {
  endpoint: string;
  sessionToken: string;
  payload: SubmitAttendanceRequest;
}): Promise<SubmitAttendanceResponse> {
  return http<SubmitAttendanceResponse>(args.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${args.sessionToken}`,
    },
    body: JSON.stringify(args.payload),
  });
}