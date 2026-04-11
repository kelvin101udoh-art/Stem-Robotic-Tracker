// apps/mobile/src/api/client/auth-client.ts

import { http } from "../http";
import type {
  AccessKeyExchangeRequest,
  AccessKeyExchangeResponse,
} from "@stemtrack/sdk";

export async function exchangeAccessKey(
  accessKey: string
): Promise<AccessKeyExchangeResponse> {
  const endpoint = process.env.EXPO_PUBLIC_ACCESS_KEY_EXCHANGE_URL;
  if (!endpoint) {
    throw new Error("Missing EXPO_PUBLIC_ACCESS_KEY_EXCHANGE_URL");
  }

  const body: AccessKeyExchangeRequest = {
    access_key: accessKey,
  };

  return http<AccessKeyExchangeResponse>(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}