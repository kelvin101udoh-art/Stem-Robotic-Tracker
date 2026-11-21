// apps/mobile/src/core/session.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BRANCH_CONFIGS,
  type BranchConfig,
  type SessionContextDTO,
  type TrackBranch,
} from 'stemtrack-sdk';

const SESSION_KEY = '@stemtrack_session_context_v2';

export class SessionStorageService {
  public static async saveSession(session: SessionContextDTO): Promise<void> {
    if (!session.sessionId || !session.branch || !session.organizationId) {
      throw new Error(
        'Invalid SessionContextDTO: missing required boundary identifiers.'
      );
    }
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  public static async getSession(): Promise<SessionContextDTO | null> {
    try {
      const serialized = await AsyncStorage.getItem(SESSION_KEY);
      if (!serialized) return null;
      return JSON.parse(serialized) as SessionContextDTO;
    } catch (error) {
      console.error('Failed to parse session storage payload:', error);
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
    await AsyncStorage.removeItem(SESSION_KEY);
  }

  public static getBranchConfig(branch: TrackBranch): BranchConfig {
    const config = BRANCH_CONFIGS[branch];
    if (!config) {
      throw new Error(`Unrecognized branch descriptor: ${branch}`);
    }
    return config;
  }
}