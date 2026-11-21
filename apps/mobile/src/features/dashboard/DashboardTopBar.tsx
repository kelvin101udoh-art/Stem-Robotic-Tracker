// apps/mobile/src/features/dashboard/DashboardTopBar.tsx
import React from "react";
import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../ui/theme";

type DashboardTopBarProps = {
  teacherName?: string | null;
  onPressNotifications?: () => void;
};

export function DashboardBrandBar({
  onPressNotifications,
}: DashboardTopBarProps) {
  return (
    <View style={styles.card}>
      <View style={styles.brandRow}>
        <Image
          source={require("../../../image/stemtrack-logo-removebg.png")}
          style={styles.logo}
        />

        <Pressable
          onPress={onPressNotifications ?? (() => {})}
          style={styles.notificationButton}
          accessibilityRole="button"
          accessibilityLabel="Open notifications"
        >
          <Ionicons name="notifications-outline" size={22} color="#0F172A" />
        </Pressable>
      </View>
    </View>
  );
}

export function DashboardIdentityHeader({ teacherName }: DashboardTopBarProps) {
  return (
    <View style={styles.identityBlock}>
      <Text style={styles.welcomeText}>Welcome back</Text>
      <Text style={styles.teacherName}>{teacherName ?? "Unknown Teacher"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: theme.spacing.sm,
    borderWidth: 0,
    borderColor: "#F1F5F9",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    marginBottom: theme.spacing.sm,
  },
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    width: 100,
    height: 90,
    resizeMode: "contain",
    backgroundColor: "transparent",
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  identityBlock: {
    gap: 2,
    paddingHorizontal: theme.spacing.md,
    marginTop: -25,
  },
  welcomeText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.color.subtext,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  teacherName: {
    fontSize: 20,
    lineHeight: 38,
    fontWeight: "900",
    color: theme.color.text,
    letterSpacing: -0.5,
  },
});