// apps/mobile/src/core/outbox.ts



import { getAuthenticatedUploadHeaders } from '../api/http';

import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import type {
  EvidenceMetadata,
  IngestEvidenceRequestDTO,
  TrackBranch,
} from 'stemtrack-sdk';

const UNIFIED_OUTBOX_KEY = '@stemtrack:unified_outbox:v1';
const MAX_MEDIA_AGE_MS = 48 * 60 * 60 * 1000; // 48 hours safeguarding TTL

export type OutboxKind = 'LIVE_VIDEO' | 'VOICE_DEBRIEF' | 'TEXT_NOTE';

export interface OutboxItem {
  id: string;
  kind: OutboxKind;
  sessionId: string;
  organizationId: string;
  branch: TrackBranch;
  autoSplit: boolean;
  taggedStudentIds: string[];
  manualNote: string;
  metadata: EvidenceMetadata;
  localMediaUri?: string;
  mediaMimeType?: string;
  mediaExtension?: 'mp4' | 'm4a';
  queuedAt: string;
}

type OutboxListener = (pendingCount: number, isSyncing: boolean) => void;

class OutboxSyncManager {
  private isSyncing = false;
  private listeners = new Set<OutboxListener>();

  public subscribe(listener: OutboxListener): () => void {
    this.listeners.add(listener);
    this.getPendingCount()
      .then((count) => listener(count, this.isSyncing))
      .catch(() => { });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private async notify(): Promise<void> {
    const count = await this.getPendingCount();
    this.listeners.forEach((cb) => cb(count, this.isSyncing));
  }

  private getOutboxDir(): string {
    const baseDir = FileSystem.documentDirectory;
    if (!baseDir) {
      throw new Error('Device document directory unavailable.');
    }
    return `${baseDir}outbox/`;
  }

  public async getPendingItems(): Promise<OutboxItem[]> {
    try {
      const raw = await AsyncStorage.getItem(UNIFIED_OUTBOX_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as OutboxItem[];
    } catch {
      return [];
    }
  }

  public async getPendingCount(): Promise<number> {
    const items = await this.getPendingItems();
    return items.length;
  }

  private async saveItems(items: OutboxItem[]): Promise<void> {
    await AsyncStorage.setItem(UNIFIED_OUTBOX_KEY, JSON.stringify(items));
    await this.notify();
  }

  public async enqueue(input: {
    kind: OutboxKind;
    sessionId: string;
    organizationId: string;
    branch: TrackBranch;
    autoSplit: boolean;
    taggedStudentIds: string[];
    manualNote: string;
    metadata: EvidenceMetadata;
    sourceMediaUri?: string;
    mediaMimeType?: string;
    mediaExtension?: 'mp4' | 'm4a';
  }): Promise<OutboxItem> {
    const id = `obx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    let persistedUri: string | undefined;

    if (input.sourceMediaUri) {
      const dir = this.getOutboxDir();
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      const ext = input.mediaExtension ?? 'mp4';
      persistedUri = `${dir}${id}.${ext}`;
      await FileSystem.copyAsync({
        from: input.sourceMediaUri,
        to: persistedUri,
      });
    }

    const item: OutboxItem = {
      id,
      kind: input.kind,
      sessionId: input.sessionId,
      organizationId: input.organizationId,
      branch: input.branch,
      autoSplit: input.autoSplit,
      taggedStudentIds: input.taggedStudentIds,
      manualNote: input.manualNote,
      metadata: input.metadata,
      localMediaUri: persistedUri,
      mediaMimeType: input.mediaMimeType,
      mediaExtension: input.mediaExtension,
      queuedAt: new Date().toISOString(),
    };

    const existing = await this.getPendingItems();
    existing.push(item);
    await this.saveItems(existing);
    return item;
  }

  public async syncNow(): Promise<{ synced: number; remaining: number }> {
    if (this.isSyncing) {
      const remaining = await this.getPendingCount();
      return { synced: 0, remaining };
    }

    const endpoint = process.env.EXPO_PUBLIC_SUBMIT_EVIDENCE_URL?.trim();
    if (!endpoint) {
      const remaining = await this.getPendingCount();
      return { synced: 0, remaining };
    }

    const items = await this.getPendingItems();
    if (items.length === 0) {
      return { synced: 0, remaining: 0 };
    }

    this.isSyncing = true;
    await this.notify();

    let synced = 0;
    const stillPending: OutboxItem[] = [];

    try {
      for (const item of items) {
        try {
          let ok = false;

          if (item.localMediaUri) {
            const info = await FileSystem.getInfoAsync(item.localMediaUri);
            if (!info.exists) {
              continue;
            }

            const form = new FormData();
            form.append('file', {
              uri: item.localMediaUri,
              name: `${item.id}.${item.mediaExtension ?? 'mp4'}`,
              type: item.mediaMimeType ?? 'video/mp4',
            } as unknown as Blob);
            form.append('sessionId', item.sessionId);
            form.append('organizationId', item.organizationId);
            form.append('branch', item.branch);
            form.append('autoSplit', String(item.autoSplit));
            form.append('taggedStudentIds', JSON.stringify(item.taggedStudentIds));
            form.append('manualNote', item.manualNote);
            form.append('metadata', JSON.stringify(item.metadata));

            // Updated: attach Supabase publishable key headers (no Content-Type for FormData)


            // Multipart upload (inside if (item.localMediaUri))
            const res = await fetch(endpoint, {
              method: 'POST',
              headers: await getAuthenticatedUploadHeaders(),
              body: form,
            });


            ok = res.ok;
          } else {
            const payload: IngestEvidenceRequestDTO = {
              sessionId: item.sessionId,
              organizationId: item.organizationId,
              branch: item.branch,
              taggedStudentIds: item.taggedStudentIds,
              manualNote: item.manualNote,
              metadata: item.metadata,
            };

            // Updated: attach Supabase publishable key + JSON Content-Type
            // JSON upload (inside else)
            const res = await fetch(endpoint, {
              method: 'POST',
              headers: await getAuthenticatedUploadHeaders('application/json'),
              body: JSON.stringify(payload),
            });


            ok = res.ok;
          }

          if (ok) {
            synced += 1;
            if (item.localMediaUri) {
              await FileSystem.deleteAsync(item.localMediaUri, {
                idempotent: true,
              }).catch(() => { });
            }
          } else {
            stillPending.push(item);
          }
        } catch {
          stillPending.push(item);
        }
      }
    } finally {
      this.isSyncing = false;
      await this.saveItems(stillPending);
    }

    return { synced, remaining: stillPending.length };
  }

  public startNetworkSyncListener(): () => void {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online =
        Boolean(state.isConnected) && state.isInternetReachable !== false;
      if (online) {
        this.syncNow().catch(() => { });
      }
    });
    return unsubscribe;
  }

  /**
   * UK GDPR & SEND Safeguarding Startup Purge:
   * 1. Expires un-synced local media older than 48 hours.
   * 2. Deletes orphaned files in outbox/ not referenced in the active index.
   * 3. Cleans leftover temporary audio recordings in cacheDirectory.
   */
  public async purgeExpiredAndOrphanedMedia(): Promise<void> {
    try {
      const now = Date.now();
      const items = await this.getPendingItems();
      const activeItems: OutboxItem[] = [];
      const referencedUris = new Set<string>();

      for (const item of items) {
        const ageMs = now - new Date(item.queuedAt).getTime();
        if (ageMs > MAX_MEDIA_AGE_MS) {
          if (item.localMediaUri) {
            await FileSystem.deleteAsync(item.localMediaUri, {
              idempotent: true,
            }).catch(() => { });
          }
        } else {
          activeItems.push(item);
          if (item.localMediaUri) {
            referencedUris.add(item.localMediaUri);
          }
        }
      }

      if (activeItems.length !== items.length) {
        await this.saveItems(activeItems);
      }

      // Remove orphaned files in outbox/
      const outboxDir = this.getOutboxDir();
      const outboxInfo = await FileSystem.getInfoAsync(outboxDir);
      if (outboxInfo.exists) {
        const files = await FileSystem.readDirectoryAsync(outboxDir);
        for (const filename of files) {
          const fullUri = `${outboxDir}${filename}`;
          if (!referencedUris.has(fullUri)) {
            await FileSystem.deleteAsync(fullUri, { idempotent: true }).catch(
              () => { }
            );
          }
        }
      }

      // Clean leftover temporary recorder files in cacheDirectory
      const cacheDir = FileSystem.cacheDirectory;
      if (cacheDir) {
        const cacheFiles = await FileSystem.readDirectoryAsync(cacheDir);
        for (const filename of cacheFiles) {
          if (filename.startsWith('capture-') && filename.endsWith('.m4a')) {
            await FileSystem.deleteAsync(`${cacheDir}${filename}`, {
              idempotent: true,
            }).catch(() => { });
          }
        }
      }
    } catch (err) {
      console.warn('Safeguarding media purge skipped:', err);
    }
  }
}

export const OutboxSyncService = new OutboxSyncManager();

