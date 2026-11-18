// apps/mobile/app/evidence.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SessionStorageService } from '../src/core/session';
import { SessionContextDTO, IngestEvidenceRequestDTO } from 'stemtrack-sdk';

interface DraftEvidenceItem {
  id: string;
  imageUri: string;
  timestamp: string;
  voiceNote?: string;
}

const DRAFTS_STORAGE_KEY = '@stemtrack_evidence_drafts_v1';

export default function EvidenceDraftQueueScreen() {
  const router = useRouter();
  const [session, setSession] = useState<SessionContextDTO | null>(null);
  const [drafts, setDrafts] = useState<DraftEvidenceItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    SessionStorageService.getSession().then((active) => {
      if (active) setSession(active);
    });
    loadPersistentDrafts();
  }, []);

  const loadPersistentDrafts = async () => {
    try {
      const stored = await AsyncStorage.getItem(DRAFTS_STORAGE_KEY);
      if (stored) {
        setDrafts(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to load drafts from storage:', err);
    }
  };

  const savePersistentDrafts = async (items: DraftEvidenceItem[]) => {
    try {
      setDrafts(items);
      await AsyncStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.error('Failed to save drafts to storage:', err);
    }
  };

  const handleCapturePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'Camera permission is required to capture offline evidence frames.');
      return;
    }

    const pickerResult = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });

    if (!pickerResult.canceled && pickerResult.assets[0]?.uri) {
      const newDraft: DraftEvidenceItem = {
        id: `draft-${Date.now()}`,
        imageUri: pickerResult.assets[0].uri,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        voiceNote: 'Pending teacher retrospective debrief note.',
      };
      await savePersistentDrafts([newDraft, ...drafts]);
    }
  };

  const handleBatchSync = async () => {
    if (!session || drafts.length === 0) return;

    setIsSyncing(true);
    try {
      for (const draft of drafts) {
        const payload: IngestEvidenceRequestDTO = {
          sessionId: session.sessionId,
          organizationId: session.organizationId,
          branch: session.branch,
          taggedStudentIds: [],
          mediaFileUrl: draft.imageUri,
          manualNote: draft.voiceNote,
          metadata: {
            captureMode: 'RETROSPECTIVE_DRAFT',
            clientTimestamp: new Date().toISOString(),
            branch: session.branch,
          } as IngestEvidenceRequestDTO['metadata'],
        };

        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/submit-evidence`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Sync failure on draft item ${draft.id}`);
        }
      }

      await AsyncStorage.removeItem(DRAFTS_STORAGE_KEY);
      setDrafts([]);
      Alert.alert('Batch Sync Complete', 'All offline photo drafts have been synced and structured successfully.');
      router.back();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network sync failed.';
      Alert.alert('Sync Error', msg);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />
      
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Retrospective Queue</Text>
        </View>
      </View>

      <Text style={styles.title}>Draft Evidence Tray</Text>
      <Text style={styles.subtitle}>
        Capture photos silently during active sessions and sync when convenient.
      </Text>

      <TouchableOpacity style={styles.captureButton} onPress={handleCapturePhoto} activeOpacity={0.8}>
        <Text style={styles.captureButtonText}>📷 Open Camera & Snap Frame</Text>
      </TouchableOpacity>

      <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
        <Text style={styles.sectionHeader}>Stored Offline Drafts ({drafts.length})</Text>
        {drafts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No pending drafts stored locally.</Text>
          </View>
        ) : (
          drafts.map((draft) => (
            <View key={draft.id} style={styles.draftCard}>
              <Image source={{ uri: draft.imageUri }} style={styles.thumbnail} />
              <View style={styles.draftInfo}>
                <Text style={styles.draftTitle}>Captured at {draft.timestamp}</Text>
                <Text style={styles.draftStatus}>Ready for AI batch structuring</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {drafts.length > 0 && (
        <TouchableOpacity
          style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
          onPress={handleBatchSync}
          disabled={isSyncing}
          activeOpacity={0.85}
        >
          {isSyncing ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.syncButtonText}>Sync Batch ({drafts.length}) to Cloud →</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617', padding: 24, paddingTop: 50 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backButton: { paddingVertical: 6, paddingRight: 12 },
  backButtonText: { color: '#94a3b8', fontSize: 16, fontWeight: '600' },
  badge: { backgroundColor: '#0f172a', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: '#334155' },
  badgeText: { color: '#38bdf8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#f8fafc' },
  subtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4, marginBottom: 20, lineHeight: 20 },
  captureButton: { backgroundColor: '#1e293b', padding: 18, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#334155', marginBottom: 24 },
  captureButtonText: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
  listContainer: { flex: 1 },
  listContent: { gap: 12, paddingBottom: 20 },
  sectionHeader: { color: '#64748b', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 1 },
  emptyCard: { backgroundColor: '#0f172a', padding: 24, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  emptyText: { color: '#64748b', fontSize: 14 },
  draftCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#1e293b' },
  thumbnail: { width: 50, height: 50, borderRadius: 8, marginRight: 14, backgroundColor: '#334155' },
  draftInfo: { flex: 1 },
  draftTitle: { color: '#f8fafc', fontSize: 14, fontWeight: '600' },
  draftStatus: { color: '#38bdf8', fontSize: 12, marginTop: 2, fontWeight: '500' },
  syncButton: { backgroundColor: '#10b981', padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 10, shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  syncButtonDisabled: { opacity: 0.6 },
  syncButtonText: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
});