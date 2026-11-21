// apps/mobile/app/home.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SessionStorageService } from '../src/core/session';
import {
  formatTimeWindow,
  getTodayTimetable,
  matchSessionToCurrentTime,
  type ScheduledSession,
} from '../src/core/timetable';
import type { BranchConfig, SessionContextDTO } from 'stemtrack-sdk';

export default function SessionHomeScreen() {
  const router = useRouter();
  const [session, setSession] = useState<SessionContextDTO | null>(null);
  const [branchConfig, setBranchConfig] = useState<BranchConfig | null>(null);
  const [timetable, setTimetable] = useState<ScheduledSession[]>([]);
  const [activeWindow, setActiveWindow] = useState<string>('Auto-Matched');
  const [pickerVisible, setPickerVisible] = useState(false);

  const todayLabel = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  useEffect(() => {
    let mounted = true;

    (async () => {
      const active = await SessionStorageService.getSession();
      if (!active) {
        router.replace('/');
        return;
      }

      const config = SessionStorageService.getBranchConfig(active.branch);
      const todaySlots = getTodayTimetable(active.branch);
      const existingSlot = todaySlots.find((s) => s.id === active.sessionId);

      let resolvedSession = active;
      let windowLabel = 'Active Slot';

      if (existingSlot) {
        windowLabel = formatTimeWindow(existingSlot);
      } else if (todaySlots.length > 0) {
        // Layer 1: Auto-match timetable to current clock time
        const { session: matched, isExactMatch } =
          matchSessionToCurrentTime(todaySlots);
        const updated = await SessionStorageService.switchActiveSession(
          matched.id,
          matched.title
        );
        if (updated) {
          resolvedSession = updated;
        }
        windowLabel = isExactMatch
          ? `${formatTimeWindow(matched)} • Live`
          : `${formatTimeWindow(matched)} • Auto`;
      }

      if (mounted) {
        setSession(resolvedSession);
        setBranchConfig(config);
        setTimetable(todaySlots);
        setActiveWindow(windowLabel);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  const handleSelectSession = async (option: ScheduledSession) => {
    const updated = await SessionStorageService.switchActiveSession(
      option.id,
      option.title
    );
    if (updated) {
      setSession(updated);
      setActiveWindow(formatTimeWindow(option));
    }
    setPickerVisible(false);
  };

  const handleEndSession = () => {
    Alert.alert(
      'End Session',
      'Close this terminal session and clear local credentials?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Session',
          style: 'destructive',
          onPress: async () => {
            await SessionStorageService.clearSession();
            router.replace('/');
          },
        },
      ]
    );
  };

  if (!session || !branchConfig) return null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.container}>
        <View style={styles.topBar}>
          <View
            style={[
              styles.branchBadge,
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
              style={[styles.branchText, { color: branchConfig.accentColor }]}
              numberOfLines={1}
            >
              {branchConfig.displayName}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleEndSession}
            style={styles.exitButton}
            hitSlop={8}
          >
            <Ionicons name="log-out-outline" size={16} color="#dc2626" />
            <Text style={styles.exitText}>Exit</Text>
          </TouchableOpacity>
        </View>

        {/* Layer 2: 1-Tap Class / Session Switcher Bar */}
        <TouchableOpacity
          style={styles.sessionBar}
          onPress={() => setPickerVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.sessionBarLeft}>
            <Text style={styles.sessionKicker}>
              {todayLabel.toUpperCase()} • {activeWindow.toUpperCase()}
            </Text>
            <Text style={styles.sessionTitle} numberOfLines={1}>
              {session.sessionName}
            </Text>
            <Text style={styles.sessionOrg} numberOfLines={1}>
              {session.organizationName} • {branchConfig.defaultFramework}
            </Text>
          </View>

          <View style={styles.switchPill}>
            <Text style={styles.switchPillText}>Switch</Text>
            <Ionicons name="chevron-down" size={14} color="#334155" />
          </View>
        </TouchableOpacity>

        {/* Strictly 2 Primary Action Buttons */}
        <View style={styles.actionsStack}>
          <TouchableOpacity
            style={[
              styles.primaryButtonCard,
              { backgroundColor: branchConfig.accentColor },
            ]}
            onPress={() => router.push('/capture-learning')}
            activeOpacity={0.86}
          >
            <View style={styles.cardTopRow}>
              <View style={styles.iconCircleLight}>
                <Ionicons name="videocam" size={26} color="#ffffff" />
              </View>
              <View style={styles.aiTag}>
                <Ionicons name="sparkles" size={12} color="#ffffff" />
                <Text style={styles.aiTagText}>AUTO-FACE PINNING</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.primaryTitle}>Live Audio & Video Capture</Text>
              <Text style={styles.primaryDesc}>
                Record in real time. AI identifies{' '}
                {branchConfig.learnerTerm.toLowerCase()} faces and stamps
                evidence directly into {session.sessionName}.
              </Text>
            </View>

            <View style={styles.primaryCtaRow}>
              <Text style={styles.primaryCtaText}>Tap to Start Recording</Text>
              <Ionicons name="arrow-forward-circle" size={22} color="#ffffff" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButtonCard}
            onPress={() => router.push('/manual-entry')}
            activeOpacity={0.84}
          >
            <View style={styles.cardTopRow}>
              <View style={styles.iconCircleSoft}>
                <Ionicons
                  name="create-outline"
                  size={26}
                  color={branchConfig.accentColor}
                />
              </View>
              <View style={styles.manualTag}>
                <Text style={styles.manualTagText}>SETTLED LOGGING</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.secondaryTitle}>
                Manual Note & {branchConfig.learnerTerm} Tag
              </Text>
              <Text style={styles.secondaryDesc}>
                Write structured observations when settled, pick{' '}
                {branchConfig.learnerTerm.toLowerCase()}(s), and attach to{' '}
                {session.sessionName}.
              </Text>
            </View>

            <View style={styles.secondaryCtaRow}>
              <Text
                style={[
                  styles.secondaryCtaText,
                  { color: branchConfig.accentColor },
                ]}
              >
                Open Manual Entry
              </Text>
              <Ionicons
                name="arrow-forward"
                size={18}
                color={branchConfig.accentColor}
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Session / Class Switcher Modal */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Select Active Class / Session</Text>
                <Text style={styles.modalSubtitle}>
                  Evidence captured will be permanently stamped to this session.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setPickerVisible(false)}
                hitSlop={10}
              >
                <Ionicons name="close" size={24} color="#475569" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalList}>
              {timetable.map((item) => {
                const isSelected = session.sessionId === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.sessionOption,
                      isSelected && {
                        borderColor: branchConfig.accentColor,
                        backgroundColor: '#eff6ff',
                      },
                    ]}
                    onPress={() => handleSelectSession(item)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.optionTitle}>{item.title}</Text>
                      <Text style={styles.optionMeta}>
                        {item.subject} • {formatTimeWindow(item)}
                      </Text>
                    </View>
                    {isSelected ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={branchConfig.accentColor}
                      />
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color="#94a3b8"
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
  },
  branchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    flexShrink: 1,
  },
  branchDot: { width: 8, height: 8, borderRadius: 4 },
  branchText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  exitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  exitText: { color: '#dc2626', fontSize: 12, fontWeight: '700' },
  sessionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 18,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  sessionBarLeft: { flex: 1 },
  sessionKicker: { fontSize: 11, fontWeight: '700', color: '#64748b', letterSpacing: 0.6 },
  sessionTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginTop: 2 },
  sessionOrg: { fontSize: 12, color: '#64748b', marginTop: 2 },
  switchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  switchPillText: { fontSize: 12, fontWeight: '700', color: '#334155' },
  actionsStack: { flex: 1, gap: 16 },
  primaryButtonCard: {
    flex: 1,
    borderRadius: 24,
    padding: 22,
    justifyContent: 'space-between',
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
  },
  secondaryButtonCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    justifyContent: 'space-between',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconCircleLight: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleSoft: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15,23,42,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  aiTagText: { color: '#ffffff', fontSize: 10, fontWeight: '800', letterSpacing: 0.7 },
  manualTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  manualTagText: { color: '#475569', fontSize: 10, fontWeight: '800', letterSpacing: 0.7 },
  cardBody: { marginVertical: 8 },
  primaryTitle: { fontSize: 22, fontWeight: '800', color: '#ffffff', marginBottom: 6 },
  primaryDesc: { fontSize: 13, color: 'rgba(255,255,255,0.92)', lineHeight: 19 },
  primaryCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
  },
  primaryCtaText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  secondaryTitle: { fontSize: 21, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  secondaryDesc: { fontSize: 13, color: '#475569', lineHeight: 19 },
  secondaryCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
  },
  secondaryCtaText: { fontSize: 14, fontWeight: '800' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  modalSubtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  modalList: { gap: 10, paddingBottom: 16 },
  sessionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    gap: 12,
  },
  optionTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  optionMeta: { fontSize: 12, color: '#64748b', marginTop: 3 },
});