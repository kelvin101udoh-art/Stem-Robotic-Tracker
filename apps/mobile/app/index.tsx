// apps/mobile/app/index.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SessionStorageService } from '../src/core/session';
import { exchangeAccessKey } from '../src/api/client/auth-client';
import type { SessionContextDTO } from 'stemtrack-sdk';

export default function AccessKeyIngressScreen() {
  const router = useRouter();
  const [accessKey, setAccessKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthorize = async () => {
    const trimmed = accessKey.trim();
    if (!trimmed) {
      Alert.alert('Validation Error', 'Enter your issued organization access key.');
      return;
    }

    setIsLoading(true);
    try {
      const auth = await exchangeAccessKey(trimmed);

      const sessionContext: SessionContextDTO = {
        sessionId: auth.session_id ?? `session-${auth.club_id}`,
        organizationId: auth.club_id,
        organizationName: auth.club_name ?? 'STEMTrack Organisation',
        branch: 'ROBOTICS_CLUB',
        sessionName: auth.teacher_role_title ?? 'Active Learning Session',
        instructorId: auth.teacher_id ?? 'instructor-active',
        instructorName: auth.teacher_name ?? 'Session Lead',
        activeRoster: [],
      };

      await SessionStorageService.saveSession(sessionContext);
      router.replace('/home');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Invalid access key credentials.';
      Alert.alert('Access Denied', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />

      <View style={styles.card}>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Enterprise Gateway</Text>
          </View>
          <Text style={styles.branchTag}>3-Branch Engine</Text>
        </View>

        <Text style={styles.header}>STEMTrack Core</Text>
        <Text style={styles.subtext}>
          Authenticate with your organization access key to initialize your sector
          branch terminal.
        </Text>

        <Text style={styles.inputLabel}>Organization Access Key</Text>
        <TextInput
          style={styles.input}
          placeholder="ENTER-ACCESS-KEY"
          placeholderTextColor="#475569"
          autoCapitalize="characters"
          autoCorrect={false}
          value={accessKey}
          onChangeText={setAccessKey}
          editable={!isLoading}
          returnKeyType="done"
          onSubmitEditing={handleAuthorize}
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleAuthorize}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Initialize Session</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#0f172a',
    padding: 28,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  badge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  badgeText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  branchTag: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 24,
    lineHeight: 22,
  },
  inputLabel: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    color: '#f8fafc',
    fontSize: 16,
    padding: 18,
    letterSpacing: 2,
    marginBottom: 24,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});