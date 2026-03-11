import { http } from "./http";

export async function exchangeAccessKey(accessKey: string): Promise<{
  session_token: string;
  expires_at: string;
  club_id: string;
}> {
  const endpoint = process.env.EXPO_PUBLIC_ACCESS_KEY_EXCHANGE_URL;
  if (!endpoint) throw new Error("Missing EXPO_PUBLIC_ACCESS_KEY_EXCHANGE_URL");

  return await http(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ access_key: accessKey }),
  });
}