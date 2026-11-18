# 📦 STEMTrack SDK (`stemtrack-sdk`)

[![npm version](https://img.shields.io/npm/v/stemtrack-sdk.svg?style=flat-square)](https://www.npmjs.com/package/stemtrack-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)

Official TypeScript data transfer objects (DTOs), payload interfaces, and type-safe API contracts for the **STEMTrack Learning Evidence Engine**. Used across the Next.js web application, Expo React Native mobile client, and Supabase Edge Functions.

## 📥 Installation

```bash
npm install stemtrack-sdk
# or
yarn add stemtrack-sdk
# or
pnpm add stemtrack-sdk
```

## 🚀 Quick Usage

```typescript
import { AttendanceRecord, VoiceReviewPayload, EvidenceItem } from 'stemtrack-sdk';

const submission: VoiceReviewPayload = {
  sessionId: 'sess_12345',
  transcript: 'Student completed the robotic chassis assembly independently.',
  timestamp: new Date().toISOString(),
};
```

## 📄 License

MIT © Kelvin Udoh