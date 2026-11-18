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
import { SessionContextDTO } from 'stemtrack-sdk';

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
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth-access-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessKey: trimmed }),
      });

      if (!response.ok) {
        throw new Error(`Authorization failed: status ${response.status}`);
      }

      const sessionData: SessionContextDTO = await response.json();
      await SessionStorageService.saveSession(sessionData);

      router.replace('/home');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid access key credentials.';
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
      <StatusBar barStyle="light-content" backgroundColor="#020617" />
      <View style={styles.card}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Enterprise Gateway</Text>
        </View>
        <Text style={styles.header}>STEMTrack Core</Text>
        <Text style={styles.subtext}>
          Authenticate with your organization access key to initialize your sector branch terminal.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="ENTER-ACCESS-KEY"
          placeholderTextColor="#475569"
          autoCapitalize="characters"
          autoCorrect={false}
          value={accessKey}
          onChangeText={setAccessKey}
          editable={!isLoading}
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleAuthorize}
          disabled={isLoading}
          activeOpacity={0.8}
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
  container: { flex: 1, backgroundColor: '#020617', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#0f172a', padding: 28, borderRadius: 24, borderWidth: 1, borderColor: '#1e293b', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
  badge: { alignSelf: 'flex-start', backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  badgeText: { color: '#38bdf8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#f8fafc', marginBottom: 8 },
  subtext: { fontSize: 14, color: '#94a3b8', marginBottom: 28, lineHeight: 22 },
  input: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#334155', borderRadius: 14, color: '#f8fafc', fontSize: 16, padding: 18, letterSpacing: 2, marginBottom: 24, fontWeight: '600' },
  button: { backgroundColor: '#2563eb', paddingVertical: 18, borderRadius: 14, alignItems: 'center', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
});