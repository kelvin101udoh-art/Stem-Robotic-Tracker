// apps/mobile/app/manual-entry.tsx


import { getAuthenticatedUploadHeaders, http } from '../src/api/http';
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SessionStorageService } from '../src/core/session';
import { VoiceRecorder, type CaptureFile } from '../src/core/recorder';
import { OutboxSyncService } from '../src/core/outbox';

import {
  InsightReviewModal,
  type ReviewableInsight,
} from '../src/ui/components/InsightReviewModal';
import type {
  BranchConfig,
  EvidenceMetadata,
  IngestEvidenceRequestDTO,
  IngestEvidenceResponseDTO,
  SessionContextDTO,
  TrackBranch,
} from 'stemtrack-sdk';

interface ChipOption {
  id: string;
  label: string;
  tint?: string;
}

interface BranchFormSchema {
  primaryGroupLabel: string;
  primaryOptions: ChipOption[];
  secondaryGroupLabel: string;
  secondaryOptions: ChipOption[];
  notePlaceholder: string;
  voiceExample: string;
}

const BRANCH_FORM_SCHEMAS: Record<TrackBranch, BranchFormSchema> = {
  ROBOTICS_CLUB: {
    primaryGroupLabel: 'Activity Focus',
    primaryOptions: [
      { id: 'hardware', label: 'Build & Hardware' },
      { id: 'coding', label: 'Coding & Logic' },
      { id: 'debugging', label: 'Debugging' },
      { id: 'teamwork', label: 'Teamwork' },
    ],
    secondaryGroupLabel: 'Independence Level',
    secondaryOptions: [
      { id: 'independent', label: 'Independent' },
      { id: 'guided', label: 'Guided' },
      { id: 'peer', label: 'Peer-Supported' },
    ],
    notePlaceholder:
      'Or type a free-flow brain dump: e.g. Leo fixed the sensor loop. Sam and Toby built the chassis...',
    voiceExample:
      'Speak naturally about multiple students—AI will split and pin each record.',
  },
  SEND_PROVISION: {
    primaryGroupLabel: 'Regulation Zone',
    primaryOptions: [
      { id: 'blue', label: 'Blue (Low)', tint: '#3b82f6' },
      { id: 'green', label: 'Green (Calm)', tint: '#10b981' },
      { id: 'yellow', label: 'Yellow (Elevated)', tint: '#f59e0b' },
      { id: 'red', label: 'Red (Crisis)', tint: '#ef4444' },
    ],
    secondaryGroupLabel: 'EHCP / Support Area',
    secondaryOptions: [
      { id: 'communication', label: 'Communication' },
      { id: 'co_regulation', label: 'Co-Regulation' },
      { id: 'sensory', label: 'Sensory Need' },
      { id: 'boundary', label: 'Boundary / Social' },
    ],
    notePlaceholder:
      'Or type a free-flow debrief: e.g. Maya used ear defenders independently when noise rose...',
    voiceExample:
      'Speak naturally—AI will split by learner and structure EHCP behaviour records.',
  },
  EARLY_YEARS: {
    primaryGroupLabel: 'EYFS Learning Area',
    primaryOptions: [
      { id: 'comm_lang', label: 'Comm. & Language' },
      { id: 'psed', label: 'Personal & Social' },
      { id: 'physical', label: 'Physical Dev.' },
      { id: 'expressive', label: 'Expressive Arts' },
    ],
    secondaryGroupLabel: 'Play Context',
    secondaryOptions: [
      { id: 'child_initiated', label: 'Child-Initiated' },
      { id: 'adult_led', label: 'Adult-Led' },
      { id: 'provision', label: 'Continuous Provision' },
    ],
    notePlaceholder:
      'Or type a free-flow debrief: e.g. Oliver and Mia narrated a story with the wooden blocks...',
    voiceExample:
      'Speak naturally—AI will split by child and map to EYFS Development Matters.',
  },
};

function buildManualMetadata(
  branch: TrackBranch,
  clientTimestamp: string
): EvidenceMetadata {
  const base = {
    captureMode: 'RETROSPECTIVE_DRAFT' as const,
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

export default function SettledDebriefScreen() {
  const router = useRouter();
  const recorder = useMemo(() => new VoiceRecorder(), []);

  const [session, setSession] = useState<SessionContextDTO | null>(null);
  const [branchConfig, setBranchConfig] = useState<BranchConfig | null>(null);

  const [autoSplitMode, setAutoSplitMode] = useState(true);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const [primarySelection, setPrimarySelection] = useState<string | null>(null);
  const [secondarySelection, setSecondarySelection] = useState<string | null>(
    null
  );
  const [noteText, setNoteText] = useState('');

  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<CaptureFile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewInsight, setReviewInsight] = useState<ReviewableInsight | null>(
    null
  );

  useEffect(() => {
    let mounted = true;
    SessionStorageService.getSession().then((active) => {
      if (!active) {
        router.replace('/');
        return;
      }
      if (mounted) {
        setSession(active);
        setBranchConfig(SessionStorageService.getBranchConfig(active.branch));
      }
    });
    return () => {
      mounted = false;
    };
  }, [router]);

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleVoiceDebrief = async () => {
    if (isSubmitting) return;

    if (!isRecording) {
      try {
        if (recordedAudio) {
          await recorder.discard(recordedAudio.uri).catch(() => { });
          setRecordedAudio(null);
        }
        await recorder.start();
        setIsRecording(true);
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Unable to start voice recorder.';
        Alert.alert('Microphone Error', msg);
      }
    } else {
      try {
        const file = await recorder.stop();
        setIsRecording(false);
        setRecordedAudio(file);
      } catch (err: unknown) {
        setIsRecording(false);
        const msg =
          err instanceof Error ? err.message : 'Unable to stop voice recorder.';
        Alert.alert('Recording Error', msg);
      }
    }
  };

  const handleDiscardAudio = async () => {
    if (!recordedAudio) return;
    await recorder.discard(recordedAudio.uri).catch(() => { });
    setRecordedAudio(null);
  };

  const handleSubmitDebrief = async () => {
    if (!session || !branchConfig || isRecording) return;

    const schema = BRANCH_FORM_SCHEMAS[session.branch];
    const primaryLabel = schema.primaryOptions.find(
      (o) => o.id === primarySelection
    )?.label;
    const secondaryLabel = schema.secondaryOptions.find(
      (o) => o.id === secondarySelection
    )?.label;

    const trimmedNote = noteText.trim();
    if (!recordedAudio && !trimmedNote && !primaryLabel) {
      Alert.alert(
        'Add Voice or Note',
        'Record a quick voice debrief, select a tag, or type a note before saving.'
      );
      return;
    }

    const structuredPrefix = [
      autoSplitMode ? '[AI_AUTO_SPLIT: TRUE]' : null,
      primaryLabel ? `[${schema.primaryGroupLabel}: ${primaryLabel}]` : null,
      secondaryLabel
        ? `[${schema.secondaryGroupLabel}: ${secondaryLabel}]`
        : null,
    ]
      .filter(Boolean)
      .join(' ');

    const combinedNote = structuredPrefix
      ? `${structuredPrefix} ${trimmedNote}`.trim()
      : trimmedNote || `Voice debrief recorded for ${session.sessionName}.`;

    const immutableTimestamp = new Date().toISOString();
    const metadata = buildManualMetadata(session.branch, immutableTimestamp);
    const resolvedStudentIds = autoSplitMode ? [] : selectedStudentIds;

    setIsSubmitting(true);
    try {
      const endpoint = process.env.EXPO_PUBLIC_SUBMIT_EVIDENCE_URL?.trim();
      if (!endpoint) {
        throw new Error('Missing EXPO_PUBLIC_SUBMIT_EVIDENCE_URL');
      }

      let result: IngestEvidenceResponseDTO;

      if (recordedAudio) {
        const form = new FormData();
        form.append('file', {
          uri: recordedAudio.uri,
          name: `debrief-${Date.now()}.m4a`,
          type: recordedAudio.mimeType || 'audio/mp4',
        } as unknown as Blob);
        form.append('sessionId', session.sessionId);
        form.append('organizationId', session.organizationId);
        form.append('branch', session.branch);
        form.append('autoSplit', String(autoSplitMode));
        form.append('taggedStudentIds', JSON.stringify(resolvedStudentIds));
        form.append('manualNote', combinedNote);
        form.append('metadata', JSON.stringify(metadata));



        // Voice debrief (inside if (recordedAudio))
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: await getAuthenticatedUploadHeaders(),
          body: form,
        });

        if (!res.ok) {
          throw new Error(`Upload failed (${res.status})`);
        }
        result = (await res.json()) as IngestEvidenceResponseDTO;



      } else {
        const payload: IngestEvidenceRequestDTO = {
          sessionId: session.sessionId,
          organizationId: session.organizationId,
          branch: session.branch,
          taggedStudentIds: resolvedStudentIds,
          manualNote: combinedNote,
          metadata,
        };





        // Text-only note (inside else)
        result = await http<IngestEvidenceResponseDTO>(endpoint, {
          method: 'POST',
          headers: await getAuthenticatedUploadHeaders('application/json'),
          body: JSON.stringify(payload),
        });

      }

      if (recordedAudio) {
        await recorder.discard(recordedAudio.uri).catch(() => { });
        setRecordedAudio(null);
      }

      setReviewInsight({
        evidenceId: result.evidenceId,
        summary: result.structuredInsight.summary,
        attributedStudentIds: resolvedStudentIds,
        curriculumTags: result.structuredInsight.curriculumTags,
      });
    } catch {
      await OutboxSyncService.enqueue({
        kind: recordedAudio ? 'VOICE_DEBRIEF' : 'TEXT_NOTE',
        sessionId: session.sessionId,
        organizationId: session.organizationId,
        branch: session.branch,
        autoSplit: autoSplitMode,
        taggedStudentIds: resolvedStudentIds,
        manualNote: combinedNote,
        metadata,
        sourceMediaUri: recordedAudio?.uri,
        mediaMimeType: recordedAudio?.mimeType ?? 'audio/mp4',
        mediaExtension: recordedAudio ? 'm4a' : undefined,
      });

      if (recordedAudio) {
        await recorder.discard(recordedAudio.uri).catch(() => { });
        setRecordedAudio(null);
      }

      Alert.alert(
        'Saved to Local Outbox',
        `Stamped for ${session.sessionName}. Your voice/note debrief will auto-sync once the cloud endpoint is ready.`,
        [{ text: 'Done', onPress: () => router.back() }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session || !branchConfig) return null;

  const schema = BRANCH_FORM_SCHEMAS[session.branch];
  const learnerLabel = branchConfig.learnerTerm;
  const audioSeconds = recordedAudio
    ? Math.max(1, Math.round(recordedAudio.durationMs / 1000))
    : 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topHeader}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            disabled={isRecording || isSubmitting}
          >
            <Ionicons name="chevron-back" size={20} color="#0f172a" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <View
            style={[
              styles.branchChip,
              { borderColor: `${branchConfig.accentColor}40` },
            ]}
          >
            <View
              style={[
                styles.branchDot,
                { backgroundColor: branchConfig.accentColor },
              ]}
            />
            <Text
              style={[
                styles.branchChipText,
                { color: branchConfig.accentColor },
              ]}
            >
              {branchConfig.displayName}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.sessionContextPill}>
            <Ionicons name="calendar-outline" size={14} color="#475569" />
            <Text style={styles.sessionContextText} numberOfLines={1}>
              Logging into:{' '}
              <Text style={styles.sessionContextBold}>
                {session.sessionName}
              </Text>
            </Text>
          </View>

          <Text style={styles.title}>Settled Voice & Note Debrief</Text>
          <Text style={styles.subtitle}>{schema.voiceExample}</Text>

          {/* 1. AI Auto-Split vs Manual Picker Toggle */}
          <View style={styles.card}>
            <View style={styles.modeRow}>
              <TouchableOpacity
                style={[
                  styles.modeTab,
                  autoSplitMode && {
                    backgroundColor: branchConfig.accentColor,
                    borderColor: branchConfig.accentColor,
                  },
                ]}
                onPress={() => setAutoSplitMode(true)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="sparkles"
                  size={14}
                  color={autoSplitMode ? '#ffffff' : '#475569'}
                />
                <Text
                  style={[
                    styles.modeTabText,
                    autoSplitMode && styles.modeTabTextActive,
                  ]}
                >
                  AI Auto-Split (Whole Class)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeTab,
                  !autoSplitMode && {
                    backgroundColor: branchConfig.accentColor,
                    borderColor: branchConfig.accentColor,
                  },
                ]}
                onPress={() => setAutoSplitMode(false)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="person-outline"
                  size={14}
                  color={!autoSplitMode ? '#ffffff' : '#475569'}
                />
                <Text
                  style={[
                    styles.modeTabText,
                    !autoSplitMode && styles.modeTabTextActive,
                  ]}
                >
                  Pick {learnerLabel}(s)
                </Text>
              </TouchableOpacity>
            </View>

            {autoSplitMode ? (
              <Text style={styles.autoSplitHint}>
                No student picking needed. Mention names naturally—the Edge LLM
                splits your debrief into individual {learnerLabel.toLowerCase()}{' '}
                records and strips raw audio at the edge.
              </Text>
            ) : session.activeRoster.length === 0 ? (
              <Text style={styles.autoSplitHint}>
                No roster profiles loaded yet—note will still be stamped to{' '}
                {session.sessionName}.
              </Text>
            ) : (
              <View style={[styles.chipWrap, { marginTop: 12 }]}>
                {session.activeRoster.map((member) => {
                  const active = selectedStudentIds.includes(member.id);
                  return (
                    <TouchableOpacity
                      key={member.id}
                      style={[
                        styles.chip,
                        active && {
                          backgroundColor: branchConfig.accentColor,
                          borderColor: branchConfig.accentColor,
                        },
                      ]}
                      onPress={() => toggleStudent(member.id)}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          active && styles.chipTextActive,
                        ]}
                      >
                        {member.firstName} {member.lastName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* 2. 1-Tap Voice Brain Dump + Text Box */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Voice Brain Dump (Fastest)</Text>

            <TouchableOpacity
              style={[
                styles.voiceBar,
                isRecording
                  ? styles.voiceBarRecording
                  : { borderColor: branchConfig.accentColor },
              ]}
              onPress={handleToggleVoiceDebrief}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.voiceIconCircle,
                  {
                    backgroundColor: isRecording
                      ? '#dc2626'
                      : branchConfig.accentColor,
                  },
                ]}
              >
                <Ionicons
                  name={isRecording ? 'stop' : 'mic'}
                  size={20}
                  color="#ffffff"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.voiceBarTitle}>
                  {isRecording
                    ? 'Recording Debrief... Tap to Stop'
                    : recordedAudio
                      ? 'Re-record Voice Brain Dump'
                      : 'Tap to Speak Brain Dump'}
                </Text>
                <Text style={styles.voiceBarSub}>
                  {isRecording
                    ? 'Speak freely about the whole class'
                    : '45-second voice note replaces typing for 20 students'}
                </Text>
              </View>
            </TouchableOpacity>

            {recordedAudio && !isRecording && (
              <View style={styles.recordedPill}>
                <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                <Text style={styles.recordedPillText}>
                  Voice debrief attached ({audioSeconds}s)
                </Text>
                <TouchableOpacity onPress={handleDiscardAudio} hitSlop={8}>
                  <Ionicons name="trash-outline" size={18} color="#dc2626" />
                </TouchableOpacity>
              </View>
            )}

            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>
              Or Type Free-Flow Note
            </Text>
            <TextInput
              style={styles.noteInput}
              placeholder={schema.notePlaceholder}
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={noteText}
              onChangeText={setNoteText}
              editable={!isSubmitting}
            />
          </View>

          {/* 3. Optional Branch Quick Tags */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>
              {schema.primaryGroupLabel} (Optional)
            </Text>
            <View style={styles.chipWrap}>
              {schema.primaryOptions.map((opt) => {
                const active = primarySelection === opt.id;
                const activeColor = opt.tint ?? branchConfig.accentColor;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.chip,
                      active && {
                        backgroundColor: activeColor,
                        borderColor: activeColor,
                      },
                    ]}
                    onPress={() => setPrimarySelection(active ? null : opt.id)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        active && styles.chipTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.sectionLabel, { marginTop: 14 }]}>
              {schema.secondaryGroupLabel} (Optional)
            </Text>
            <View style={styles.chipWrap}>
              {schema.secondaryOptions.map((opt) => {
                const active = secondarySelection === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.chip,
                      active && {
                        backgroundColor: branchConfig.accentColor,
                        borderColor: branchConfig.accentColor,
                      },
                    ]}
                    onPress={() =>
                      setSecondarySelection(active ? null : opt.id)
                    }
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        active && styles.chipTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Submit CTA */}
          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: branchConfig.accentColor },
              (isSubmitting || isRecording) && styles.disabledBtn,
            ]}
            onPress={handleSubmitDebrief}
            disabled={isSubmitting || isRecording}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View style={styles.submitBtnInner}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color="#ffffff"
                />
                <Text style={styles.submitBtnText}>
                  {autoSplitMode
                    ? 'Auto-Split & Save Evidence'
                    : 'Structure & Save Evidence'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <InsightReviewModal
        visible={Boolean(reviewInsight)}
        insight={reviewInsight}
        branchConfig={branchConfig}
        sessionName={session.sessionName}
        roster={session.activeRoster}
        onConfirm={() => {
          setReviewInsight(null);
          router.back();
        }}
        onDiscard={() => setReviewInsight(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
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
  backText: { color: '#0f172a', fontSize: 15, fontWeight: '700' },
  branchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  branchDot: { width: 7, height: 7, borderRadius: 4 },
  branchChipText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 18, paddingBottom: 32 },
  sessionContextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 12,
  },
  sessionContextText: { fontSize: 12, color: '#475569' },
  sessionContextBold: { fontWeight: '700', color: '#0f172a' },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 19,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  modeTabText: { fontSize: 12, fontWeight: '700', color: '#334155' },
  modeTabTextActive: { color: '#ffffff' },
  autoSplitHint: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 10,
    lineHeight: 18,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  voiceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
  },
  voiceBarRecording: {
    backgroundColor: '#fef2f2',
    borderColor: '#dc2626',
  },
  voiceIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceBarTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  voiceBarSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  recordedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
  },
  recordedPillText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#065f46',
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 999,
  },
  chipText: { color: '#334155', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#ffffff', fontWeight: '700' },
  noteInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    padding: 14,
    minHeight: 105,
    color: '#0f172a',
    fontSize: 15,
    lineHeight: 22,
  },
  submitBtn: {
    paddingVertical: 17,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  submitBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  disabledBtn: { opacity: 0.6 },
  submitBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
});