// apps/mobile/src/core/session.ts

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BRANCH_CONFIGS,
  type BranchConfig,
  type RosterMemberDTO,
  type SessionContextDTO,
  type TrackBranch,
} from 'stemtrack-sdk';

const SECURE_SESSION_CORE_KEY = 'stemtrack_session_core_v2';
const SECURE_SESSION_TOKEN_KEY = 'stemtrack_session_token_v2';
const ROSTER_CACHE_KEY = '@stemtrack_roster_cache_v2';

const SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

type SessionCore = Omit<SessionContextDTO, 'activeRoster'>;

export class SessionStorageService {
  public static async saveSession(
    session: SessionContextDTO,
    sessionToken?: string
  ): Promise<void> {
    if (!session.sessionId || !session.branch || !session.organizationId) {
      throw new Error(
        'Invalid SessionContextDTO: missing required boundary identifiers.'
      );
    }

    const { activeRoster, ...core } = session;

    await SecureStore.setItemAsync(
      SECURE_SESSION_CORE_KEY,
      JSON.stringify(core),
      SECURE_OPTIONS
    );

    if (sessionToken) {
      await SecureStore.setItemAsync(
        SECURE_SESSION_TOKEN_KEY,
        sessionToken,
        SECURE_OPTIONS
      );
    }

    await AsyncStorage.setItem(
      ROSTER_CACHE_KEY,
      JSON.stringify(activeRoster ?? [])
    );
  }

  public static async getSession(): Promise<SessionContextDTO | null> {
    try {
      const coreRaw = await SecureStore.getItemAsync(SECURE_SESSION_CORE_KEY);
      if (!coreRaw) return null;

      const core = JSON.parse(coreRaw) as SessionCore;
      const rosterRaw = await AsyncStorage.getItem(ROSTER_CACHE_KEY);
      const activeRoster: RosterMemberDTO[] = rosterRaw
        ? (JSON.parse(rosterRaw) as RosterMemberDTO[])
        : [];

      return { ...core, activeRoster };
    } catch (error) {
      console.error('Failed to read secure session:', error);
      return null;
    }
  }

  public static async getSessionToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(SECURE_SESSION_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  public static async switchActiveSession(
    sessionId: string,
    sessionName: string
  ): Promise<SessionContextDTO | null> {
    const current = await this.getSession();
    if (!current) return null;

    const updated: SessionContextDTO = {
      ...current,
      sessionId,
      sessionName,
    };

    await this.saveSession(updated);
    return updated;
  }

  public static async clearSession(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(SECURE_SESSION_CORE_KEY).catch(() => {}),
      SecureStore.deleteItemAsync(SECURE_SESSION_TOKEN_KEY).catch(() => {}),
      AsyncStorage.removeItem(ROSTER_CACHE_KEY).catch(() => {}),
    ]);
  }

  public static getBranchConfig(branch: TrackBranch): BranchConfig {
    const config = BRANCH_CONFIGS[branch];
    if (!config) {
      throw new Error(`Unrecognized branch descriptor: ${branch}`);
    }
    return config;
  }
}