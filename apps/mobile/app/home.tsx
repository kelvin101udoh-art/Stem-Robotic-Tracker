// apps/mobile/app/home.tsx
import { ScrollView, View, StyleSheet, ImageBackground } from "react-native";
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
import { DashboardBrandBar, DashboardIdentityHeader } from "../src/features/dashboard/DashboardTopBar";
import { useState } from "react";
import { ResponsiveContainer } from "../src/ui/components/ResponsiveContainer";



export default function HomeScreen() {
  const [showIdentityHeader, setShowIdentityHeader] = useState(true);
  const router = useRouter();
  const { teacherName,
    sessionToken, clubId, expiresAt, isChecking } = useRequireSession();

  async function onLogout() {
    await clearSession();
    router.replace("/");
  }

  if (isChecking || !sessionToken) {
    return null;
  }

  return (


    <LinearGradient colors={["#F8FAFC", "#E6ECF5"]} style={styles.background}>

      <ImageBackground
        source={require("../image/background-image.jpg")}
        style={styles.fullScreenImage}
        resizeMode="cover"
      >
        {/* The Overlay makes sure the image doesn't distract from the text */}
        <View style={styles.mainOverlay}>

          <View style={styles.stickyHeader}>
            <DashboardBrandBar onPressNotifications={() => { }} />
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}
            onScroll={(event) => {
              const y = event.nativeEvent.contentOffset.y;

              if (y > 20) {
                setShowIdentityHeader(false);
              }
            }}
            scrollEventThrottle={16}
          >
            <AppShell>
              <ResponsiveContainer>

                {showIdentityHeader && (
                  <DashboardIdentityHeader teacherName={teacherName} />
                )}
                <View style={styles.tilesContainer}>
                  <ModeTile
                    icon="🎤"
                    title="Capture Learning"
                    description="Record in-session observations..."
                    onPress={() => router.push("/capture-learning")}
                  />
                  <ModeTile
                    icon="✅"
                    title="Attendance"
                    description="Mark attendance manually..."
                    onPress={() => router.push("/attendance")}
                  />
                  <ModeTile
                    icon="📷"
                    title="Capture Evidence"
                    description="Attach photo and video..."
                    onPress={() => router.push("/evidence")}
                  />
                </View>

                <Button
                  label="Log Out"
                  variant="secondary"
                  onPress={onLogout}
                />
              </ResponsiveContainer>

            </AppShell>

          </ScrollView>
        </View>
      </ImageBackground>

    </LinearGradient>


  );


}

/*
const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#EEF3F8",
  },

  stickyHeader: {
    paddingTop: 36,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    backgroundColor: "rgba(238,243,248,0.96)",
    zIndex: 10,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xl,
  },


  // In your StyleSheet
  overlay: {
    flex: 1,
    padding: 16, // This is the secret! It gives space between the image edge and your cards
    gap: 12,     // Adds space between the tiles themselves
    backgroundColor: "rgba(0,0,0,0.05)", // Very subtle tint to make the white cards "pop"
  },

  backgroundImage: {
    flex: 1, // Ensures it covers the whole screen
    resizeMode: "cover",

  },


  tiles: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xxl,
    marginTop: theme.spacing.xxl,

  },
});
*/

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  fullScreenImage: {
    flex: 1,
  },
  mainOverlay: {
    flex: 1,
    backgroundColor: "rgba(42, 21, 233, 0.18)", // This lightens the image so text is easy to read
  },
  stickyHeader: {
    paddingTop: 50,
    paddingHorizontal: theme.spacing.lg,
    // Remove solid background to let the image show through
    backgroundColor: "transparent",
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },

  tilesContainer: {
    gap: 20, // More space between the three cards
    marginVertical: 30, // Pushes the cards away from the Header and the Logout button
    paddingHorizontal: 4, // Keeps cards wide but away from screen edges
  },
});
