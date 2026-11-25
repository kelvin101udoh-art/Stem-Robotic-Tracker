// apps/mobile/src/ui/components/InsightReviewModal.tsx

import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BranchConfig, RosterMemberDTO } from 'stemtrack-sdk';

export interface ReviewableInsight {
  evidenceId?: string;
  summary: string;
  attributedStudentIds: string[];
  curriculumTags?: string[];
  behaviourNote?: string;
}

interface InsightReviewModalProps {
  visible: boolean;
  insight: ReviewableInsight | null;
  branchConfig: BranchConfig;
  sessionName: string;
  roster: RosterMemberDTO[];
  onConfirm: (finalized: {
    summary: string;
    studentIds: string[];
  }) => void;
  onDiscard: () => void;
}

export function InsightReviewModal({
  visible,
  insight,
  branchConfig,
  sessionName,
  roster,
  onConfirm,
  onDiscard,
}: InsightReviewModalProps) {
  const [editedSummary, setEditedSummary] = useState('');
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);

  useEffect(() => {
    if (insight) {
      setEditedSummary(insight.summary);
      setPinnedIds(insight.attributedStudentIds);
    }
  }, [insight]);

  if (!insight) return null;

  const toggleStudent = (id: string) => {
    setPinnedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const pinnedMembers = roster.filter((r) => pinnedIds.includes(r.id));
  const unpinnedMembers = roster.filter((r) => !pinnedIds.includes(r.id));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDiscard}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.auditPill}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={13}
                  color="#059669"
                />
                <Text style={styles.auditPillText}>AUDIT-SAFE REVIEW</Text>
              </View>
              <Text style={styles.title}>Confirm AI Insight</Text>
              <Text style={styles.subtitle}>
                {sessionName} • {branchConfig.displayName}
              </Text>
            </View>
            <TouchableOpacity onPress={onDiscard} hitSlop={10}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={{ paddingBottom: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Attributed Students with 1-tap override */}
            <Text style={styles.label}>
              Pinned {branchConfig.learnerTerm}(s) ({pinnedIds.length})
            </Text>

            {roster.length === 0 ? (
              <Text style={styles.hint}>
                Session-level record (no roster profiles loaded to override).
              </Text>
            ) : (
              <>
                <View style={styles.chipWrap}>
                  {pinnedMembers.map((member) => (
                    <TouchableOpacity
                      key={member.id}
                      style={[
                        styles.pinnedChip,
                        { backgroundColor: branchConfig.accentColor },
                      ]}
                      onPress={() => toggleStudent(member.id)}
                    >
                      <Text style={styles.pinnedChipText}>
                        {member.firstName} {member.lastName}
                      </Text>
                      <Ionicons name="close-circle" size={16} color="#ffffff" />
                    </TouchableOpacity>
                  ))}
                  {pinnedMembers.length === 0 && (
                    <Text style={styles.hint}>
                      No {branchConfig.learnerTerm.toLowerCase()} pinned yet. Tap + below to add.
                    </Text>
                  )}
                </View>

                {unpinnedMembers.length > 0 && (
                  <View style={[styles.chipWrap, { marginTop: 10 }]}>
                    {unpinnedMembers.map((member) => (
                      <TouchableOpacity
                        key={member.id}
                        style={styles.addChip}
                        onPress={() => toggleStudent(member.id)}
                      >
                        <Ionicons name="add" size={14} color="#334155" />
                        <Text style={styles.addChipText}>
                          {member.firstName} {member.lastName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}

            {/* Editable AI Summary */}
            <Text style={[styles.label, { marginTop: 18 }]}>
              Structured Branch Summary (Editable)
            </Text>
            <TextInput
              style={styles.summaryInput}
              multiline
              value={editedSummary}
              onChangeText={setEditedSummary}
              textAlignVertical="top"
            />

            {insight.curriculumTags && insight.curriculumTags.length > 0 && (
              <View style={styles.tagsBox}>
                <Text style={styles.label}>Framework Tags</Text>
                <View style={styles.chipWrap}>
                  {insight.curriculumTags.map((tag, idx) => (
                    <View key={`${tag}-${idx}`} style={styles.tagPill}>
                      <Text style={styles.tagPillText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.confirmBtn,
                { backgroundColor: branchConfig.accentColor },
              ]}
              onPress={() =>
                onConfirm({
                  summary: editedSummary.trim() || insight.summary,
                  studentIds: pinnedIds,
                })
              }
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
              <Text style={styles.confirmBtnText}>Confirm & Commit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.discardBtn}
              onPress={onDiscard}
              activeOpacity={0.8}
            >
              <Text style={styles.discardBtnText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 10,
  },
  auditPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 6,
  },
  auditPillText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  body: { maxHeight: 360 },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  hint: { fontSize: 12, color: '#64748b', lineHeight: 18 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pinnedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  pinnedChipText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  addChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
  },
  addChipText: { color: '#334155', fontSize: 12, fontWeight: '600' },
  summaryInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    padding: 14,
    minHeight: 110,
    color: '#0f172a',
    fontSize: 14,
    lineHeight: 21,
  },
  tagsBox: { marginTop: 14 },
  tagPill: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  tagPillText: { color: '#1d4ed8', fontSize: 12, fontWeight: '600' },
  footer: { marginTop: 14, gap: 8 },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  confirmBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  discardBtn: { paddingVertical: 10, alignItems: 'center' },
  discardBtnText: { color: '#64748b', fontSize: 14, fontWeight: '600' },
});