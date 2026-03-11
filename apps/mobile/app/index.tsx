import { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "../src/ui/components/Screen";
import { Card } from "../src/ui/components/Card";
import { Field } from "../src/ui/components/Field";
import { Button } from "../src/ui/components/Button";
import { theme } from "../src/ui/theme";
import { exchangeAccessKey } from "../src/api/auth";
import { saveSession } from "../src/core/session";

export default function AccessKeyScreen() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onContinue() {
    setErr(null);
    const trimmed = key.trim();
    if (trimmed.length < 8) {
      setErr("Please enter a valid Access Key.");
      return;
    }

    setLoading(true);
    try {
      const res = await exchangeAccessKey(trimmed);
      await saveSession(res.session_token, res.expires_at);
      router.replace("/capture");
    } catch (e: any) {
      setErr(e?.message ?? "Access denied.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Card>
        <View style={{ gap: theme.spacing.md }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: theme.color.text }}>
            Session Capture
          </Text>
          <Text style={{ color: theme.color.subtext, lineHeight: 20 }}>
            Secure access is required. Captures are processed by STEMTrack to generate session reports.
          </Text>

          <Field
            label="Access Key"
            value={key}
            onChangeText={setKey}
            placeholder="Enter your access key"
            secureTextEntry
          />

          {err ? <Text style={{ color: theme.color.danger }}>{err}</Text> : null}

          <Button label="Continue" onPress={onContinue} loading={loading} />
          <Text style={{ color: theme.color.muted, fontSize: 12, lineHeight: 18 }}>
            This app captures session reflections only. Reports appear in STEMTrack.
          </Text>
        </View>
      </Card>
    </Screen>
  );
}