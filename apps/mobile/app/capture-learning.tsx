// stem-robotic-tracker-monorepo/apps/mobile/app/capture-learning.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SessionStorageService } from '../src/core/session';
import {
  SessionContextDTO,
  BranchConfig,
  IngestEvidenceRequestDTO,
  IngestEvidenceResponseDTO,
} from 'stemtrack-sdk';

export default function UnifiedCaptureScreen() {
  const router = useRouter();
  const [session, setSession] = useState<SessionContextDTO | null>(null);
  const [config, setConfig] = useState<BranchConfig | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    SessionStorageService.getSession().then((active) => {
      if (!active) {
        router.replace('/');
        return;
      }
      setSession(active);
      setConfig(SessionStorageService.getBranchConfig(active.branch));
    });
  }, [router]);

  const toggleStudentSelection = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExecuteVoiceCapture = async () => {
    if (!isRecording) {
      // Start recording immediately without blocking on roster selection
      setIsRecording(true);
      return;
    }

    // Stop recording and trigger ingestion payload dispatch
    setIsRecording(false);
    setIsUploading(true);

    try {
      if (!session || !config) return;

      const payload: IngestEvidenceRequestDTO = {
        sessionId: session.sessionId,
        organizationId: session.organizationId,
        branch: session.branch,
        taggedStudentIds: selectedStudentIds, // Optional at capture time; AI or post-tagging can expand
        manualNote: `Verbal learning observation recorded via mobile terminal for ${config.displayName}.`,
        metadata: {
          captureMode: 'LIVE_VOICE',
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
        throw new Error(`Cloud ingest error: status ${response.status}`);
      }

      const result: IngestEvidenceResponseDTO = await response.json();
      Alert.alert('Insight Processed Successfully', result.structuredInsight.summary, [
        { text: 'Done', onPress: () => setSelectedStudentIds([]) },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Transmission failed.';
      Alert.alert('Processing Error', msg);
    } finally {
      setIsUploading(false);
    }
  };

  if (!session || !config) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />
      
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={[styles.branchPill, { borderColor: config.accentColor }]}>
          <Text style={[styles.branchPillText, { color: config.accentColor }]}>
            {config.displayName}
          </Text>
        </View>
      </View>

      <Text style={styles.title}>Capture Observation</Text>
      <Text style={styles.subtitle}>
        Tap record instantly. Optionally tag active {config.learnerTerm.toLowerCase()}s before or after.
      </Text>

      {/* Optional Roster Multi-Tag Chips */}
      <View style={styles.rosterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rosterScroll}>
          {session.activeRoster.map((student) => {
            const isSelected = selectedStudentIds.includes(student.id);
            return (
              <TouchableOpacity
                key={student.id}
                style={[
                  styles.chip,
                  isSelected && { backgroundColor: config.accentColor, borderColor: config.accentColor },
                ]}
                onPress={() => toggleStudentSelection(student.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {student.firstName} {student.lastName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Mode A: Instant Live Voice Trigger */}
      <View style={styles.controlBox}>
        <TouchableOpacity
          style={[
            styles.recordTrigger,
            isRecording && styles.recordTriggerActive,
            !isRecording && { borderColor: config.accentColor },
          ]}
          onPress={handleExecuteVoiceCapture}
          disabled={isUploading}
          activeOpacity={0.85}
        >
          {isUploading ? (
            <ActivityIndicator color="#ffffff" size="large" />
          ) : (
            <View style={styles.triggerInner}>
              <Text style={styles.triggerIcon}>{isRecording ? '⏹' : '🎙'}</Text>
              <Text style={styles.triggerText}>
                {isRecording ? 'Complete & Synthesize' : '1-Tap Voice Log'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.recordingHint}>
          {isRecording ? 'Recording active session audio... Tap to finish.' : 'Zero friction: start speaking immediately.'}
        </Text>
      </View>

      {/* Mode B: Retrospective Draft Queue Shortcut */}
      {config.allowDraftQueue && (
        <TouchableOpacity
          style={styles.draftQueueBar}
          onPress={() => router.push('/evidence')}
          disabled={isRecording || isUploading}
          activeOpacity={0.8}
        >
          <Text style={styles.draftQueueEmoji}>📷</Text>
          <View style={styles.draftQueueTextContainer}>
            <Text style={styles.draftQueueTitle}>Retrospective Draft Queue</Text>
            <Text style={styles.draftQueueSubtitle}>Snap photos now, attach voice notes later</Text>
          </View>
          <Text style={styles.draftQueueArrow}>→</Text>
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
  branchPill: { backgroundColor: '#0f172a', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  branchPillText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#f8fafc' },
  subtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4, marginBottom: 20, lineHeight: 20 },
  rosterContainer: { maxHeight: 56, marginBottom: 30 },
  rosterScroll: { gap: 10, alignItems: 'center' },
  chip: { backgroundColor: '#0f172a', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, borderWidth: 1, borderColor: '#1e293b' },
  chipText: { color: '#cbd5e1', fontSize: 14, fontWeight: '500' },
  chipTextSelected: { color: '#ffffff', fontWeight: 'bold' },
  controlBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 20 },
  recordTrigger: { width: 230, height: 230, borderRadius: 115, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', borderWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 10 },
  recordTriggerActive: { backgroundColor: '#ef4444', borderColor: '#fca5a5' },
  triggerInner: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  triggerIcon: { fontSize: 36, marginBottom: 8 },
  triggerText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  recordingHint: { color: '#64748b', fontSize: 13, marginTop: 20, textAlign: 'center' },
  draftQueueBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', padding: 18, borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', marginBottom: 10 },
  draftQueueEmoji: { fontSize: 24, marginRight: 14 },
  draftQueueTextContainer: { flex: 1 },
  draftQueueTitle: { color: '#f8fafc', fontSize: 15, fontWeight: 'bold' },
  draftQueueSubtitle: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  draftQueueArrow: { color: '#38bdf8', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
});