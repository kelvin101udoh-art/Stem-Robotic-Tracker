// apps/mobile/app/index.tsx


import { useState } from "react";
import { Text, View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { AppShell } from "../src/ui/components/AppShell";
import { Card } from "../src/ui/components/Card";
import { Field } from "../src/ui/components/Field";
import { Button } from "../src/ui/components/Button";
import { SectionLabel } from "../src/ui/components/SectionLabel";
import { InfoBanner } from "../src/ui/components/InfoBanner";
import { theme } from "../src/ui/theme";
import { exchangeAccessKey } from "../src/api/client/auth-client";
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
      await saveSession({
        token: res.session_token,
        expiresAtIso: res.expires_at,
        clubId: res.club_id,
        clubName: res.club_name ?? null,
        sessionId: res.session_id ?? null,
        teacherId: res.teacher_id ?? null,
        teacherName: res.teacher_name ?? null,
        teacherRoleTitle: res.teacher_role_title ?? null,
      });

      router.replace("/home");
    } catch (e: any) {
      setErr(e?.message ?? "Access denied.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell centered>
      <Card>
        <View style={styles.stack}>
          <SectionLabel>Secure Session Access</SectionLabel>

          <View style={styles.header}>
            <Text style={styles.title}>STEMTrack Capture</Text>
            <Text style={styles.subtitle}>
              Authorised teaching access is required before using voice capture,
              attendance workflows, and evidence collection.
            </Text>
          </View>

          <Field
            label="Access Key"
            value={key}
            onChangeText={setKey}
            placeholder="Enter your access key"
            secureTextEntry
          />

          {err ? <InfoBanner tone="danger" text={err} /> : null}

          <Button label="Continue" onPress={onContinue} loading={loading} />

          <InfoBanner
            tone="info"
            text="This environment is restricted to approved STEMTrack teaching sessions. Activity may be validated against your session context."
          />
        </View>
      </Card>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: theme.spacing.lg,
  },
  header: {
    gap: 6,
  },
  title: {
    color: theme.color.text,
    ...theme.typography.title,
  },
  subtitle: {
    color: theme.color.subtext,
    ...theme.typography.body,
  },
});