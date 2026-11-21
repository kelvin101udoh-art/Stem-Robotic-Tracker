// stem-robotic-tracker-monorepo/apps/mobile/app/capture-learning.tsx


import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { SessionStorageService } from '../src/core/session';
import type {
  BranchConfig,
  EvidenceMetadata,
  IngestEvidenceResponseDTO,
  SessionContextDTO,
} from 'stemtrack-sdk';

const OUTBOX_INDEX_KEY = '@stemtrack:evidence_outbox_index:v2';

interface QueuedEvidenceItem {
  id: string;
  localMediaUri: string;
  sessionId: string;
  organizationId: string;
  branch: SessionContextDTO['branch'];
  manualNote: string;
  metadata: EvidenceMetadata;
  queuedAt: string;
}

function createBranchMetadata(session: SessionContextDTO): EvidenceMetadata {
  const base = {
    captureMode: 'LIVE_VOICE' as const,
    clientTimestamp: new Date().toISOString(),
  };

  switch (session.branch) {
    case 'ROBOTICS_CLUB':
      return { ...base, branch: 'ROBOTICS_CLUB' };
    case 'SEND_PROVISION':
      return { ...base, branch: 'SEND_PROVISION' };
    case 'EARLY_YEARS':
      return { ...base, branch: 'EARLY_YEARS' };
  }
}

export default function LiveMediaCaptureScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView | null>(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const [session, setSession] = useState<SessionContextDTO | null>(null);
  const [branchConfig, setBranchConfig] = useState<BranchConfig | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const active = await SessionStorageService.getSession();
      if (!active) {
        router.replace('/');
        return;
      }
      if (mounted) {
        setSession(active);
        setBranchConfig(SessionStorageService.getBranchConfig(active.branch));
      }

      if (!cameraPermission?.granted) {
        await requestCameraPermission();
      }
      if (!micPermission?.granted) {
        await requestMicPermission();
      }
    })();

    return () => {
      mounted = false;
    };
  }, [
    router,
    cameraPermission?.granted,
    micPermission?.granted,
    requestCameraPermission,
    requestMicPermission,
  ]);

  const queueToFilesystemOutbox = async (
    tempVideoUri: string,
    activeSession: SessionContextDTO,
    activeConfig: BranchConfig,
    metadata: EvidenceMetadata
  ) => {
    const baseDir = FileSystem.documentDirectory;
    if (!baseDir) {
      throw new Error('Device document directory unavailable.');
    }

    const outboxDir = `${baseDir}outbox/`;
    await FileSystem.makeDirectoryAsync(outboxDir, { intermediates: true });

    const id = `ev-${Date.now()}`;
    const persistedUri = `${outboxDir}${id}.mp4`;
    await FileSystem.copyAsync({ from: tempVideoUri, to: persistedUri });

    const item: QueuedEvidenceItem = {
      id,
      localMediaUri: persistedUri,
      sessionId: activeSession.sessionId,
      organizationId: activeSession.organizationId,
      branch: activeSession.branch,
      manualNote: `Live audio/video observation captured in ${activeConfig.displayName}.`,
      metadata,
      queuedAt: new Date().toISOString(),
    };

    const existingRaw = await AsyncStorage.getItem(OUTBOX_INDEX_KEY);
    const existing: QueuedEvidenceItem[] = existingRaw
      ? (JSON.parse(existingRaw) as QueuedEvidenceItem[])
      : [];

    existing.unshift(item);
    await AsyncStorage.setItem(OUTBOX_INDEX_KEY, JSON.stringify(existing));
  };

  const uploadEvidenceMultipart = async (
    videoUri: string,
    activeSession: SessionContextDTO,
    activeConfig: BranchConfig,
    metadata: EvidenceMetadata
  ): Promise<IngestEvidenceResponseDTO> => {
    const endpoint = process.env.EXPO_PUBLIC_SUBMIT_EVIDENCE_URL?.trim();
    if (!endpoint) {
      throw new Error('Missing EXPO_PUBLIC_SUBMIT_EVIDENCE_URL');
    }

    const form = new FormData();
    form.append('file', {
      uri: videoUri,
      name: `capture-${Date.now()}.mp4`,
      type: 'video/mp4',
    } as unknown as Blob);
    form.append('sessionId', activeSession.sessionId);
    form.append('organizationId', activeSession.organizationId);
    form.append('branch', activeSession.branch);
    form.append('taggedStudentIds', JSON.stringify([]));
    form.append(
      'manualNote',
      `Live audio/video observation captured in ${activeConfig.displayName}.`
    );
    form.append('metadata', JSON.stringify(metadata));

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
      body: form,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Upload failed (${res.status}). ${text}`);
    }

    return (await res.json()) as IngestEvidenceResponseDTO;
  };

  function createBranchMetadata(
    branch: SessionContextDTO['branch'],
    clientTimestamp: string
  ): EvidenceMetadata {
    const base = {
      captureMode: 'LIVE_VOICE' as const,
      clientTimestamp,
    };

    switch (branch) {
      case 'ROBOTICS_CLUB':
        return { ...base, branch: 'ROBOTICS_CLUB' };
      case 'SEND_PROVISION':
        return { ...base, branch: 'SEND_PROVISION' };
      case 'EARLY_YEARS':
        return { ...base, branch: 'EARLY_YEARS' };
    }
  }

  const handleToggleRecording = async () => {
    if (!session || !branchConfig || !cameraRef.current || isProcessing) return;

    if (!isRecording) {
      // Lock session context & timestamp at the exact moment capture begins
      const immutableTimestamp = new Date().toISOString();
      const lockedSession: SessionContextDTO = {
        ...session,
        sessionId: session.sessionId,
        branch: session.branch,
      };

      try {
        setIsRecording(true);
        const videoResult = await cameraRef.current.recordAsync({
          maxDuration: 180,
        });

        setIsRecording(false);
        if (!videoResult?.uri) return;

        setIsProcessing(true);
        const metadata = createBranchMetadata(
          lockedSession.branch,
          immutableTimestamp
        );

        try {
          const response = await uploadEvidenceMultipart(
            videoResult.uri,
            lockedSession,
            branchConfig,
            metadata
          );

          Alert.alert(
            'Evidence Processed & Pinned',
            response.structuredInsight.summary,
            [{ text: 'Done' }]
          );
        } catch {
          await queueToFilesystemOutbox(
            videoResult.uri,
            lockedSession,
            branchConfig,
            metadata
          );
          Alert.alert(
            'Queued Offline',
            'Saved to local device outbox. It will sync once the edge endpoint is reachable.'
          );
        } finally {
          await FileSystem.deleteAsync(videoResult.uri, {
            idempotent: true,
          }).catch(() => { });
          setIsProcessing(false);
        }
      } catch (err: unknown) {
        setIsRecording(false);
        setIsProcessing(false);
        const message =
          err instanceof Error ? err.message : 'Unable to capture video/audio.';
        Alert.alert('Capture Error', message);
      }
    } else {
      cameraRef.current.stopRecording();
    }
  };

  if (!session || !branchConfig) return null;

  const hasPermissions = Boolean(
    cameraPermission?.granted && micPermission?.granted
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />

      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          disabled={isRecording || isProcessing}
        >
          <Ionicons name="chevron-back" size={20} color="#f8fafc" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View
          style={[styles.branchChip, { borderColor: branchConfig.accentColor }]}
        >
          <Text
            style={[styles.branchChipText, { color: branchConfig.accentColor }]}
          >
            {branchConfig.displayName}
          </Text>
        </View>
      </View>

      <View style={styles.cameraWrapper}>
        {hasPermissions ? (
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            mode="video"
          />
        ) : (
          <View style={styles.permissionFallback}>
            <Ionicons name="camera-outline" size={36} color="#94a3b8" />
            <Text style={styles.permissionTitle}>
              Camera & Microphone Access Required
            </Text>
            <TouchableOpacity
              style={[
                styles.permissionBtn,
                { backgroundColor: branchConfig.accentColor },
              ]}
              onPress={async () => {
                await requestCameraPermission();
                await requestMicPermission();
              }}
            >
              <Text style={styles.permissionBtnText}>Grant Permissions</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.overlayBanner}>
          <Ionicons name="scan-outline" size={16} color="#38bdf8" />
          <Text style={styles.overlayBannerText}>
            Auto-identifying {branchConfig.learnerTerm.toLowerCase()} faces from
            onboarding roster
          </Text>
        </View>
      </View>

      <View style={styles.controlsArea}>
        <TouchableOpacity
          style={[
            styles.captureTrigger,
            isRecording
              ? styles.captureTriggerActive
              : { backgroundColor: branchConfig.accentColor },
          ]}
          onPress={handleToggleRecording}
          disabled={!hasPermissions || isProcessing}
          activeOpacity={0.85}
        >
          {isProcessing ? (
            <ActivityIndicator color="#ffffff" size="large" />
          ) : (
            <>
              <Ionicons
                name={isRecording ? 'stop' : 'videocam'}
                size={28}
                color="#ffffff"
              />
              <Text style={styles.captureLabel}>
                {isRecording ? 'Stop & Analyze' : 'Capture Audio + Video'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.helperText}>
          {isProcessing
            ? 'Running edge face attribution & branch insight synthesis...'
            : isRecording
              ? 'Recording audio & video... Tap Stop when complete.'
              : 'No student selection needed—AI pins evidence automatically.'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020617',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
    gap: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingRight: 8,
  },
  backText: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600',
  },
  branchChip: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  branchChipText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cameraWrapper: {
    flex: 1,
    marginHorizontal: 18,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  camera: {
    flex: 1,
  },
  overlayBanner: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(2, 6, 23, 0.82)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
  overlayBannerText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  permissionFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  permissionTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  permissionBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  permissionBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  controlsArea: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
    alignItems: 'center',
    gap: 12,
  },
  captureTrigger: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  captureTriggerActive: {
    backgroundColor: '#dc2626',
  },
  captureLabel: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  helperText: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});