// apps/mobile/app/_layout.tsx

import React from 'react';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#020617' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" options={{ animation: 'fade' }} />
      <Stack.Screen name="home" />
      <Stack.Screen name="capture-learning" />
      <Stack.Screen name="capture" />
      <Stack.Screen name="evidence" />
      <Stack.Screen name="manual-entry"/>
    </Stack>
  );
}