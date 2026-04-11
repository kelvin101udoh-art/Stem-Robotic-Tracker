import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../theme";

export function AppHeader({
  eyebrow,
  title,
  subtitle,
  rightSlot,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {rightSlot ? <View>{rightSlot}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.spacing.md,
  },
  left: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    color: theme.color.primaryText,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
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