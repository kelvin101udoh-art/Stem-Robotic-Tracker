// apps/mobile/app/home.tsx
import { ScrollView, View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { AppShell } from "../src/ui/components/AppShell";
import { LinearGradient } from "expo-linear-gradient";
import { ModeTile } from "../src/ui/components/ModeTile";
import { Button } from "../src/ui/components/Button";
import { InfoBanner } from "../src/ui/components/InfoBanner";
import { clearSession } from "../src/core/session";
import { useRequireSession } from "../src/hooks/useRequireSession";
import { SessionContextCard } from "../src/features/dashboard/SessionContextCard";
import { theme } from "../src/ui/theme";
import { DashboardTopBar } from "../src/features/dashboard/DashboardTopBar";


export default function HomeScreen() {
  const router = useRouter();
  const { teacherName,
    teacherRoleTitle, sessionToken, clubId, expiresAt, isChecking } = useRequireSession();

  async function onChangeKey() {
    await clearSession();
    router.replace("/");
  }

  if (isChecking || !sessionToken) {
    return null;
  }

  return (
  <LinearGradient
    colors={["#F8FAFC", "#EEF2F7", "#E6ECF5"]}
    style={styles.background}
  >
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <AppShell>
        <DashboardTopBar
          teacherName={teacherName}
          teacherRoleTitle={teacherRoleTitle}
          onPressNotifications={() => {}}
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
  </LinearGradient>
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