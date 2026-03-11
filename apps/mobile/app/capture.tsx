import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "../src/ui/components/Screen";
import { Card } from "../src/ui/components/Card";
import { Button } from "../src/ui/components/Button";
import { StatusPill } from "../src/ui/components/StatusPill";
import { theme } from "../src/ui/theme";
import { getSession, clearSession, isExpired } from "../src/core/session";
import { VoiceRecorder, CaptureFile } from "../src/core/recorder";
import { submitCapture } from "../src/api/captures";

type UIState = "READY" | "CAPTURING" | "REVIEW" | "UPLOADING" | "SUBMITTED" | "FAILED";

export default function CaptureScreen() {
  const router = useRouter();
  const recorder = useMemo(() => new VoiceRecorder(), []);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  const [ui, setUi] = useState<UIState>("READY");
  const [file, setFile] = useState<CaptureFile | null>(null);
  const [message, setMessage] = useState<string>("");

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
      setMessage(e?.message ?? "Unable to start capture.");
      setUi("FAILED");
    }
  }

  async function onStop() {
    setMessage("");
    try {
      const f = await recorder.stop();
      // Optional enterprise constraint (v0): cap to 3 mins
      if (f.durationMs > 3 * 60 * 1000) {
        await recorder.discard(f.uri);
        setMessage("Capture too long for v0. Please keep reflections under 3 minutes.");
        setUi("FAILED");
        return;
      }
      setFile(f);
      setUi("REVIEW");
    } catch (e: any) {
      setMessage(e?.message ?? "Unable to stop capture.");
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
      setMessage(`Submitted. Report is generating in STEMTrack. Ref: ${res.capture_id}`);
      await recorder.discard(file.uri); // remove local copy after submit
      setFile(null);
      setUi("SUBMITTED");
      // Auto-reset to ready after a short moment (optional)
      setTimeout(() => setUi("READY"), 1800);
    } catch (e: any) {
      setMessage(e?.message ?? "Submit failed. Please try again.");
      setUi("FAILED");
    }
  }

  async function onChangeKey() {
    await clearSession();
    router.replace("/");
  }

  const status: any =
    ui === "CAPTURING" ? "CAPTURING" :
    ui === "UPLOADING" ? "UPLOADING" :
    ui === "SUBMITTED" ? "SUBMITTED" :
    ui === "FAILED" ? "FAILED" :
    "READY";

  return (
    <Screen>
      <Card>
        <View style={{ gap: theme.spacing.md }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 22, fontWeight: "800", color: theme.color.text }}>
              Session Capture
            </Text>
            <StatusPill status={status} />
          </View>

          <Text style={{ color: theme.color.subtext, lineHeight: 20 }}>
            Capture what happened during the session. STEMTrack will generate the report and evidence.
          </Text>

          {ui === "READY" && (
            <Button label="Start Capture" onPress={onStart} />
          )}

          {ui === "CAPTURING" && (
            <Button label="Stop" onPress={onStop} />
          )}

          {ui === "REVIEW" && (
            <View style={{ gap: theme.spacing.sm }}>
              <Button label="Submit to STEMTrack" onPress={onSubmit} />
              <Button label="Discard" onPress={onDiscard} variant="secondary" />
            </View>
          )}

          {ui === "UPLOADING" && (
            <Button label="Submitting…" onPress={() => {}} disabled loading />
          )}

          {(message?.length ?? 0) > 0 && (
            <Text style={{ color: ui === "FAILED" ? theme.color.danger : theme.color.text }}>
              {message}
            </Text>
          )}

          <Text
            onPress={onChangeKey}
            style={{ color: theme.color.muted, marginTop: theme.spacing.md }}
          >
            Change Access Key
          </Text>

          <Text style={{ color: theme.color.muted, fontSize: 12, lineHeight: 18 }}>
            Note: No audio library is stored on device. Captures are submitted only for report generation.
          </Text>
        </View>
      </Card>
    </Screen>
  );
}