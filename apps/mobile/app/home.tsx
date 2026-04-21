// apps/mobile/app/home.tsx
import { ImageBackground, ScrollView, View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { AppShell } from "../src/ui/components/AppShell";
import { AppHeader } from "../src/ui/components/AppHeader";
import { ModeTile } from "../src/ui/components/ModeTile";
import { Button } from "../src/ui/components/Button";
import { InfoBanner } from "../src/ui/components/InfoBanner";
import { clearSession } from "../src/core/session";
import { useRequireSession } from "../src/hooks/useRequireSession";
import { SessionContextCard } from "../src/features/dashboard/SessionContextCard";
import { theme } from "../src/ui/theme";

export default function HomeScreen() {
  const router = useRouter();
  const { sessionToken, clubId, expiresAt, isChecking } = useRequireSession();

  async function onChangeKey() {
    await clearSession();
    router.replace("/");
  }

  if (isChecking || !sessionToken) {
    return null;
  }

  return (
    <ImageBackground
      source={require("../image/background-image.jpg")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <AppShell>
            <AppHeader
              eyebrow="Capture Workspace"
              title="Session Operations"
              subtitle="Select the workflow you need for this session."
            />

            <SessionContextCard clubId={clubId} expiresAt={expiresAt} />

            <InfoBanner
              tone="info"
              text="Learning capture, attendance, and evidence collection are separated into dedicated workflows to improve reliability, auditability, and classroom usability."
            />

            <View style={styles.tiles}>
              <ModeTile
                icon="🎤"
                title="Capture Learning"
                description="Record in-session observations and end-of-session reflections."
                onPress={() => router.push("/capture-learning")}
              />

              <ModeTile
                icon="✅"
                title="Attendance"
                description="Mark attendance manually or review voice-assisted matches before final save."
                onPress={() => router.push("/attendance")}
              />

              <ModeTile
                icon="📷"
                title="Capture Evidence"
                description="Attach photo and video evidence with session metadata."
                onPress={() => router.push("/evidence")}
              />
            </View>

            <Button
              label="Change Access Key"
              variant="secondary"
              onPress={onChangeKey}
            />
          </AppShell>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(8, 12, 20, 0.75)",
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: theme.spacing.lg,
  },
  tiles: {
    gap: theme.spacing.md,
  },
});