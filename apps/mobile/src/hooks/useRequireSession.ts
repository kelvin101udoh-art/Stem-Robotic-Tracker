import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { clearSession, getSession, isExpired } from "../core/session";

type GuardState = {
  sessionToken: string | null;
  clubId: string | null;
  expiresAt: string | null;
  isChecking: boolean;
};

export function useRequireSession() {
  const router = useRouter();
  const [state, setState] = useState<GuardState>({
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