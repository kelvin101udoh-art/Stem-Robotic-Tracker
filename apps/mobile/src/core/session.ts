// apps/mobile/src/core/session.ts


import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "stemtrack_capture_session_token";
const EXP_KEY = "stemtrack_capture_session_exp";
const CLUB_KEY = "stemtrack_capture_club_id";
const CLUB_NAME_KEY = "stemtrack_capture_club_name";
const SESSION_ID_KEY = "stemtrack_capture_session_id";
const TEACHER_ID_KEY = "stemtrack_capture_teacher_id";
const TEACHER_NAME_KEY = "stemtrack_capture_teacher_name";
const TEACHER_ROLE_TITLE_KEY = "stemtrack_capture_teacher_role_title";

type StoredSession = {
  token: string;
  expiresAt: string;
  clubId?: string | null;
  clubName?: string | null;
  sessionId?: string | null;
  teacherId?: string | null;
  teacherName?: string | null;
  teacherRoleTitle?: string | null;
};

function isWeb() {
  return Platform.OS === "web";
}

async function setItem(key: string, value: string) {
  if (isWeb()) {
    window.localStorage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string) {
  if (isWeb()) {
    return window.localStorage.getItem(key);
  }

  return await SecureStore.getItemAsync(key);
}

async function deleteItem(key: string) {
  if (isWeb()) {
    window.localStorage.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

export async function saveSession(args: {
  token: string;
  expiresAtIso: string;
  clubId?: string | null;
  clubName?: string | null;
  sessionId?: string | null;
  teacherId?: string | null;
  teacherName?: string | null;
  teacherRoleTitle?: string | null;
}) {
  await setItem(TOKEN_KEY, args.token);
  await setItem(EXP_KEY, args.expiresAtIso);

  if (args.clubId) {
    await setItem(CLUB_KEY, args.clubId);
  } else {
    await deleteItem(CLUB_KEY);
  }

  if (args.clubName) {
    await setItem(CLUB_NAME_KEY, args.clubName);
  } else {
    await deleteItem(CLUB_NAME_KEY);
  }

  if (args.sessionId) {
    await setItem(SESSION_ID_KEY, args.sessionId);
  } else {
    await deleteItem(SESSION_ID_KEY);
  }

  if (args.teacherId) {
    await setItem(TEACHER_ID_KEY, args.teacherId);
  } else {
    await deleteItem(TEACHER_ID_KEY);
  }

  if (args.teacherName) {
    await setItem(TEACHER_NAME_KEY, args.teacherName);
  } else {
    await deleteItem(TEACHER_NAME_KEY);
  }

  if (args.teacherRoleTitle) {
    await setItem(TEACHER_ROLE_TITLE_KEY, args.teacherRoleTitle);
  } else {
    await deleteItem(TEACHER_ROLE_TITLE_KEY);
  }
}

export async function getSession(): Promise<StoredSession | null> {
  const token = await getItem(TOKEN_KEY);
  const expiresAt = await getItem(EXP_KEY);
  const clubId = await getItem(CLUB_KEY);
  const clubName = await getItem(CLUB_NAME_KEY);
  const sessionId = await getItem(SESSION_ID_KEY);
  const teacherId = await getItem(TEACHER_ID_KEY);
  const teacherName = await getItem(TEACHER_NAME_KEY);
  const teacherRoleTitle = await getItem(TEACHER_ROLE_TITLE_KEY);

  if (!token || !expiresAt) {
    return null;
  }

  return {
    token,
    expiresAt,
    clubId,
    clubName,
    sessionId,
    teacherId,
    teacherName,
    teacherRoleTitle,
  };
}

export async function clearSession() {
  await deleteItem(TOKEN_KEY);
  await deleteItem(EXP_KEY);
  await deleteItem(CLUB_KEY);
  await deleteItem(CLUB_NAME_KEY);
  await deleteItem(SESSION_ID_KEY);
  await deleteItem(TEACHER_ID_KEY);
  await deleteItem(TEACHER_NAME_KEY);
  await deleteItem(TEACHER_ROLE_TITLE_KEY);
}

export function isExpired(expiresAtIso: string) {
  return new Date(expiresAtIso).getTime() <= Date.now();
}