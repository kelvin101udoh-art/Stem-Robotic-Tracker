import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "stemtrack_capture_session_token";
const EXP_KEY = "stemtrack_capture_session_exp";

export async function saveSession(token: string, expiresAtIso: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(EXP_KEY, expiresAtIso);
}

export async function getSession(): Promise<{ token: string; expiresAt: string } | null> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const expiresAt = await SecureStore.getItemAsync(EXP_KEY);
  if (!token || !expiresAt) return null;
  return { token, expiresAt };
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(EXP_KEY);
}

export function isExpired(expiresAtIso: string) {
  return new Date(expiresAtIso).getTime() <= Date.now();
}