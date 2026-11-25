// apps/mobile/app/_layout.tsx

import React, { useEffect, useRef } from 'react';
import { AppState, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { OutboxSyncService } from '../src/core/outbox';
import { SessionStorageService } from '../src/core/session';

const INACTIVITY_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes

export default function RootLayout() {
  usePreventScreenCapture();

  const router = useRouter();
  const lastActivityRef = useRef<number>(Date.now());
  const backgroundedAtRef = useRef<number | null>(null);

  const lockIfSessionActive = async () => {
    const active = await SessionStorageService.getSession();
    if (!active) return;
    await SessionStorageService.clearSession();
    router.replace('/');
  };

  useEffect(() => {
    OutboxSyncService.purgeExpiredAndOrphanedMedia().catch(() => {});
    const unsubscribeNet = OutboxSyncService.startNetworkSyncListener();

    // Check foreground inactivity every 60 seconds
    const interval = setInterval(() => {
      if (Date.now() - lastActivityRef.current > INACTIVITY_TIMEOUT_MS) {
        lockIfSessionActive().catch(() => {});
      }
    }, 60_000);

    // Check elapsed time when returning from background
    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        backgroundedAtRef.current = Date.now();
      } else if (nextState === 'active') {
        const bgAt = backgroundedAtRef.current;
        backgroundedAtRef.current = null;
        if (bgAt && Date.now() - bgAt > INACTIVITY_TIMEOUT_MS) {
          lockIfSessionActive().catch(() => {});
        } else {
          lastActivityRef.current = Date.now();
        }
      }
    });

    return () => {
      unsubscribeNet();
      clearInterval(interval);
      appStateSub.remove();
    };
  }, [router]);

  return (
    <View
      style={{ flex: 1 }}
      onTouchStart={() => {
        lastActivityRef.current = Date.now();
      }}
    >
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#f8fafc' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="home" />
        <Stack.Screen name="capture-learning" />
        <Stack.Screen name="manual-entry" />
      </Stack>
    </View>
  );
}