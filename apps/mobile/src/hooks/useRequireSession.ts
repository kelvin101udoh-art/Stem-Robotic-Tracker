// apps/mobile/src/hooks/useRequireSession.ts
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import type { BranchConfig, SessionContextDTO } from "stemtrack-sdk";
import { SessionStorageService } from "../core/session";

type GuardState = {
  session: SessionContextDTO | null;
  branchConfig: BranchConfig | null;
  isChecking: boolean;
};

export function useRequireSession() {
  const router = useRouter();
  const [state, setState] = useState<GuardState>({
    session: null,
    branchConfig: null,
    isChecking: true,
  });

  useEffect(() => {
    let mounted = true;

    (async () => {
      const session = await SessionStorageService.getSession();

      if (!session) {
        await SessionStorageService.clearSession();
        if (mounted) {
          setState({
            session: null,
            branchConfig: null,
            isChecking: false,
          });
          router.replace("/");
        }
        return;
      }

      const branchConfig = SessionStorageService.getBranchConfig(session.branch);

      if (mounted) {
        setState({
          session,
          branchConfig,
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