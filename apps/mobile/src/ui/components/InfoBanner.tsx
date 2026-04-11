import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../theme";

type Tone = "info" | "success" | "warning" | "danger";

const toneMap = {
  info: {
    bg: theme.color.infoSoft,
    fg: theme.color.info,
    border: "#C7D7FE",
  },
  success: {
    bg: theme.color.successSoft,
    fg: theme.color.success,
    border: "#ABEFC6",
  },
  warning: {
    bg: theme.color.warningSoft,
    fg: theme.color.warning,
    border: "#FEC84B",
  },
  danger: {
    bg: theme.color.dangerSoft,
    fg: theme.color.danger,
    border: "#FECDCA",
  },
} as const;

export function InfoBanner({
  tone = "info",
  text,
}: {
  tone?: Tone;
  text: string;
}) {
  const t = toneMap[tone];

  return (
    <View style={[styles.banner, { backgroundColor: t.bg, borderColor: t.border }]}>
      <Text style={[styles.text, { color: t.fg }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
  },
  text: {
    ...theme.typography.body,
    fontWeight: "600",
  },
});