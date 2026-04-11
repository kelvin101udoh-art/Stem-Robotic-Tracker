import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { theme } from "../theme";

export function AttendanceRow({
  name,
  present,
  onPress,
}: {
  name: string;
  present: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, present && styles.rowActive]}
    >
      <View style={styles.left}>
        <View style={[styles.dot, present && styles.dotActive]} />
        <Text style={styles.name}>{name}</Text>
      </View>

      <View style={[styles.badge, present ? styles.badgePresent : styles.badgeAbsent]}>
        <Text style={[styles.badgeText, present ? styles.presentText : styles.absentText]}>
          {present ? "Present" : "Absent"}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 60,
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.color.surface,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowActive: {
    borderColor: "#B2CCFF",
    backgroundColor: "#F5F9FF",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    flex: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: theme.color.borderStrong,
  },
  dotActive: {
    backgroundColor: theme.color.success,
  },
  name: {
    color: theme.color.text,
    fontSize: 16,
    fontWeight: "700",
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radius.pill,
  },
  badgePresent: {
    backgroundColor: theme.color.successSoft,
  },
  badgeAbsent: {
    backgroundColor: theme.color.surfaceAlt,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "800",
  },
  presentText: {
    color: theme.color.success,
  },
  absentText: {
    color: theme.color.muted,
  },
});