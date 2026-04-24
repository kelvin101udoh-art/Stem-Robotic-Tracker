//  apps/mobile/src/hooks/useRequireSession.ts

import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { clearSession, getSession, isExpired } from "../core/session";

type GuardState = {
  teacherName: string | null;
  teacherRoleTitle: string | null;
  sessionToken: string | null;
  clubId: string | null;
  expiresAt: string | null;
  isChecking: boolean;
};

export function useRequireSession() {
  const router = useRouter();
  const [state, setState] = useState<GuardState>({
    teacherName: null,
    teacherRoleTitle: null,
    sessionToken: null,
    clubId: null,
    expiresAt: null,
    isChecking: true,
  });

  useEffect(() => {
    let mounted = true;

    (async () => {
      const session = await getSession();

      if (!session || isExpired(session.expiresAt)) {
        await clearSession();
        if (mounted) {
          setState({
            teacherName: null,
            teacherRoleTitle: null,
            sessionToken: null,
            clubId: null,
            expiresAt: null,
            isChecking: false,
          });
          router.replace("/");
        }
        return;
      }

      if (mounted) {
        setState({
          teacherName: session.teacherName ?? null,
          teacherRoleTitle: session.teacherRoleTitle ?? null,
          sessionToken: session.token,
          clubId: session.clubId ?? null,
          expiresAt: session.expiresAt,
          isChecking: false,
        });
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  return state;
}