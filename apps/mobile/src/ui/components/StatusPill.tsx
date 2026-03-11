import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../theme";

type Status = "READY" | "CAPTURING" | "UPLOADING" | "SUBMITTED" | "FAILED";

const map = {
  READY: { bg: "#EEF2FF", fg: "#3730A3" },
  CAPTURING: { bg: "#ECFDF3", fg: theme.color.success },
  UPLOADING: { bg: "#FFFAEB", fg: theme.color.warning },
  SUBMITTED: { bg: "#ECFDF3", fg: theme.color.success },
  FAILED: { bg: "#FEF3F2", fg: theme.color.danger },
} as const;

export function StatusPill({ status }: { status: Status }) {
  const c = map[status];
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.fg }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  text: { fontWeight: "800", letterSpacing: 0.6, fontSize: 12 },
});