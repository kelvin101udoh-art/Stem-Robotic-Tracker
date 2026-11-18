// apps/mobile/app/home.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { SessionStorageService } from '../src/core/session';
import { SessionContextDTO, BranchConfig } from 'stemtrack-sdk';

export default function SessionDashboardScreen() {
  const router = useRouter();
  const [session, setSession] = useState<SessionContextDTO | null>(null);
  const [branchConfig, setBranchConfig] = useState<BranchConfig | null>(null);

  useEffect(() => {
    SessionStorageService.getSession().then((active) => {
      if (!active) {
        router.replace('/');
        return;
      }
      setSession(active);
      setBranchConfig(SessionStorageService.getBranchConfig(active.branch));
    });
  }, [router]);

  const handleEndSession = () => {
    Alert.alert('Conclude Terminal Session', 'Are you sure you want to close this session and clear local device state?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Conclude',
        style: 'destructive',
        onPress: async () => {
          await SessionStorageService.clearSession();
          router.replace('/');
        },
      },
    ]);
  };

  if (!session || !branchConfig) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />
      
      <View style={styles.branchHeader}>
        <View style={[styles.badge, { borderColor: branchConfig.accentColor }]}>
          <Text style={[styles.badgeText, { color: branchConfig.accentColor }]}>
            {branchConfig.displayName}
          </Text>
        </View>
        <TouchableOpacity onPress={handleEndSession} style={styles.endButton}>
          <Text style={styles.endText}>End Terminal</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>{session.sessionName}</Text>
      <Text style={styles.meta}>
        {session.organizationName} • Instructor: {session.instructorName}
      </Text>

      {/* Roster Context Card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardHeader}>Active Roster Context</Text>
          <View style={styles.liveDot} />
        </View>
        <Text style={styles.cardMetric}>
          {session.activeRoster.length}{' '}
          <Text style={styles.metricLabel}>{branchConfig.learnerTerm}s enrolled</Text>
        </Text>
        <Text style={styles.cardFootnote}>
          Roster records are indexed in real-time by the Edge AI parser for precise student attribution without requiring manual attendance registers.
        </Text>
      </View>

      {/* Primary Capture Ingress */}
      <TouchableOpacity
        style={[styles.primaryAction, { backgroundColor: branchConfig.accentColor }]}
        onPress={() => router.push('/capture-learning')}
        activeOpacity={0.85}
      >
        <Text style={styles.actionKicker}>Evidence Engine Active</Text>
        <Text style={styles.actionTitle}>Log {branchConfig.learnerTerm} Insight</Text>
        <Text style={styles.actionDetail}>
          Framework: {branchConfig.defaultFramework}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  content: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  branchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  badge: { backgroundColor: '#0f172a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  badgeText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  endButton: { padding: 4 },
  endText: { color: '#ef4444', fontSize: 13, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#f8fafc', marginBottom: 4 },
  meta: { fontSize: 14, color: '#94a3b8', marginBottom: 28, lineHeight: 20 },
  card: { backgroundColor: '#0f172a', padding: 22, borderRadius: 20, borderWidth: 1, borderColor: '#1e293b', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardHeader: { color: '#94a3b8', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' },
  cardMetric: { fontSize: 32, fontWeight: 'bold', color: '#f8fafc', marginTop: 8 },
  metricLabel: { fontSize: 16, fontWeight: 'normal', color: '#64748b' },
  cardFootnote: { fontSize: 13, color: '#64748b', marginTop: 12, lineHeight: 20 },
  primaryAction: { padding: 24, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  actionKicker: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 },
  actionTitle: { color: '#ffffff', fontSize: 22, fontWeight: 'bold', marginTop: 6 },
  actionDetail: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4, fontWeight: '500' },
});