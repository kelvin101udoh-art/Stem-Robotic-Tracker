import {
  Audio,
  InterruptionModeAndroid,
  InterruptionModeIOS,
} from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import * as Crypto from "expo-crypto";

export type CaptureFile = {
  uri: string;
  filename: string;
  mimeType: string;
  durationMs: number;
};

export class VoiceRecorder {
  private recording: Audio.Recording | null = null;

  async start(): Promise<void> {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      shouldDuckAndroid: true,
    });

    const perm = await Audio.requestPermissionsAsync();
    if (!perm.granted) {
      throw new Error("Microphone permission not granted.");
    }

    if (this.recording) {
      throw new Error("Recording already in progress.");
    }

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );

    this.recording = recording;
  }

  async stop(): Promise<CaptureFile> {
    if (!this.recording) {
      throw new Error("No active capture.");
    }

    const rec = this.recording;
    this.recording = null;

    await rec.stopAndUnloadAsync();

    const uri = rec.getURI();
    const status = await rec.getStatusAsync();

    if (!uri) {
      throw new Error("Capture file missing.");
    }

    const durationMs =
      "durationMillis" in status && typeof status.durationMillis === "number"
        ? status.durationMillis
        : 0;

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