import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "stemtrack_capture_session_token";
const EXP_KEY = "stemtrack_capture_session_exp";
const CLUB_KEY = "stemtrack_capture_club_id";
const CLUB_NAME_KEY = "stemtrack_capture_club_name";
const SESSION_ID_KEY = "stemtrack_capture_session_id";

export async function saveSession(args: {
  token: string;
  expiresAtIso: string;
  clubId?: string | null;
  clubName?: string | null;
  sessionId?: string | null;
}) {
  await SecureStore.setItemAsync(TOKEN_KEY, args.token);
  await SecureStore.setItemAsync(EXP_KEY, args.expiresAtIso);

  if (args.clubId) await SecureStore.setItemAsync(CLUB_KEY, args.clubId);
  if (args.clubName) await SecureStore.setItemAsync(CLUB_NAME_KEY, args.clubName);
  if (args.sessionId) await SecureStore.setItemAsync(SESSION_ID_KEY, args.sessionId);
}

export async function getSession(): Promise<{
  token: string;
  expiresAt: string;
  clubId?: string | null;
  clubName?: string | null;
  sessionId?: string | null;
} | null> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const expiresAt = await SecureStore.getItemAsync(EXP_KEY);
  const clubId = await SecureStore.getItemAsync(CLUB_KEY);
  const clubName = await SecureStore.getItemAsync(CLUB_NAME_KEY);
  const sessionId = await SecureStore.getItemAsync(SESSION_ID_KEY);

  if (!token || !expiresAt) return null;

  return {
    token,
    expiresAt,
    clubId,
    clubName,
    sessionId,
  };
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(EXP_KEY);
  await SecureStore.deleteItemAsync(CLUB_KEY);
  await SecureStore.deleteItemAsync(CLUB_NAME_KEY);
  await SecureStore.deleteItemAsync(SESSION_ID_KEY);
}

export function isExpired(expiresAtIso: string) {
  return new Date(expiresAtIso).getTime() <= Date.now();
}