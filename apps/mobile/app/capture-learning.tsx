// stem-robotic-tracker-monorepo/apps/mobile/app/capture-learning.tsx

import { useEffect, useMemo, useState } from "react";
import { Text, View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { AppShell } from "../src/ui/components/AppShell";
import { AppHeader } from "../src/ui/components/AppHeader";
import { Card } from "../src/ui/components/Card";
import { Button } from "../src/ui/components/Button";
import { StatusPill } from "../src/ui/components/StatusPill";
import { InfoBanner } from "../src/ui/components/InfoBanner";
import { theme } from "../src/ui/theme";
import { clearSession, getSession, isExpired } from "../src/core/session";
import { CaptureFile, VoiceRecorder } from "../src/core/recorder";
import { submitCapture } from "../src/api/captures";

type UIState = "READY" | "CAPTURING" | "REVIEW" | "UPLOADING" | "SUBMITTED" | "FAILED";

export default function CaptureLearningScreen() {
  const router = useRouter();
  const recorder = useMemo(() => new VoiceRecorder(), []);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [ui, setUi] = useState<UIState>("READY");
  const [file, setFile] = useState<CaptureFile | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      const s = await getSession();
      if (!s || isExpired(s.expiresAt)) {
        await clearSession();
        router.replace("/");
        return;
      }
      setSessionToken(s.token);
    })();
  }, [router]);

  async function onStart() {
    setMessage("");
    try {
      await recorder.start();
      setUi("CAPTURING");
    } catch (e: any) {
      setMessage(e?.message ?? "Unable to start recording.");
      setUi("FAILED");
    }
  }

  async function onStop() {
    setMessage("");
    try {
      const f = await recorder.stop();
      if (f.durationMs > 3 * 60 * 1000) {
        await recorder.discard(f.uri);
        setMessage("Please keep voice captures under 3 minutes.");
        setUi("FAILED");
        return;
      }
      setFile(f);
      setUi("REVIEW");
    } catch (e: any) {
      setMessage(e?.message ?? "Unable to stop recording.");
      setUi("FAILED");
    }
  }

  async function onDiscard() {
    setMessage("");
    if (file) await recorder.discard(file.uri);
    setFile(null);
    setUi("READY");
  }

  async function onSubmit() {
    if (!file || !sessionToken) return;

    setUi("UPLOADING");
    setMessage("Submitting capture securely…");

    try {
      const res = await submitCapture({ sessionToken, file });
      await recorder.discard(file.uri);
      setFile(null);
      setMessage(`Submitted successfully. Ref: ${res.capture_id}`);
      setUi("SUBMITTED");
    } catch (e: any) {
      setMessage(e?.message ?? "Submit failed.");
      setUi("FAILED");
    }
  }

  const status =
    ui === "CAPTURING"
      ? "CAPTURING"
      : ui === "UPLOADING"
      ? "UPLOADING"
      : ui === "SUBMITTED"
      ? "SUBMITTED"
      : ui === "FAILED"
      ? "FAILED"
      : "READY";

  return (
    <AppShell>
      <AppHeader
        eyebrow="Voice Reflection"
        title="Capture Learning"
        subtitle="Record natural learning observations during or after the session."
        rightSlot={<StatusPill status={status} />}
      />

      <Card>
        <View style={styles.stack}>
          <Text style={styles.body}>
            This workflow is designed for low-friction voice capture. STEMTrack will structure submitted observations into session reporting outputs.
          </Text>

          {ui === "READY" && (
            <Button label="Start Recording" onPress={onStart} />
          )}

          {ui === "CAPTURING" && (
            <Button label="Stop Recording" onPress={onStop} />
          )}

          {ui === "REVIEW" && (
            <View style={{ gap: theme.spacing.sm }}>
              <Button label="Submit to STEMTrack" onPress={onSubmit} />
              <Button label="Discard Recording" variant="secondary" onPress={onDiscard} />
            </View>
          )}

          {ui === "UPLOADING" && (
            <Button label="Submitting…" onPress={() => {}} disabled loading />
          )}

          {!!message && (
            <InfoBanner
              tone={ui === "FAILED" ? "danger" : ui === "SUBMITTED" ? "success" : "info"}
              text={message}
            />
          )}

          <InfoBanner
            tone="warning"
            text="To preserve reliability and limit upload failure risk, voice captures should remain concise. For this version, keep recordings under 3 minutes."
          />
        </View>
      </Card>

      <Button
        label="Back to Dashboard"
        variant="secondary"
        onPress={() => router.push("/home")}
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: theme.spacing.md,
  },
  body: {
    color: theme.color.subtext,
    ...theme.typography.body,
  },
});