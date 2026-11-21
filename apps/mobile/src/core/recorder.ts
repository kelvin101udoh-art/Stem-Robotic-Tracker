// apps/mobile/src/core/recorder.ts

import {
  AudioModule,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";
import * as Crypto from "expo-crypto";

export type CaptureFile = {
  uri: string;
  filename: string;
  mimeType: string;
  durationMs: number;
};

export class VoiceRecorder {
  private recording: InstanceType<typeof AudioModule.AudioRecorder> | null = null;
  private startedAt = 0;

  async start(): Promise<void> {
    const perm = await requestRecordingPermissionsAsync();
    if (!perm.granted) {
      throw new Error("Microphone permission not granted.");
    }

    if (this.recording) {
      throw new Error("Recording already in progress.");
    }

    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
    });

    const rec = new AudioModule.AudioRecorder(RecordingPresets.HIGH_QUALITY);
    await rec.prepareToRecordAsync();
    rec.record();

    this.recording = rec;
    this.startedAt = Date.now();
  }

  async stop(): Promise<CaptureFile> {
    if (!this.recording) {
      throw new Error("No active capture.");
    }

    const rec = this.recording;
    this.recording = null;

    await rec.stop();

    const uri = rec.uri;
    if (!uri) {
      throw new Error("Capture file missing.");
    }

    const status = rec.getStatus();
    const durationMs =
      typeof status?.durationMillis === "number" && status.durationMillis > 0
        ? status.durationMillis
        : Math.max(1000, Date.now() - this.startedAt);

    const id = Crypto.randomUUID();
    const filename = `capture-${id}.m4a`;
    const dest = `${FileSystem.cacheDirectory}${filename}`;

    await FileSystem.copyAsync({
      from: uri,
      to: dest,
    });

    return {
      uri: dest,
      filename,
      mimeType: "audio/mp4",
      durationMs,
    };
  }

  async discard(fileUri: string): Promise<void> {
    await FileSystem.deleteAsync(fileUri, { idempotent: true });
  }
}