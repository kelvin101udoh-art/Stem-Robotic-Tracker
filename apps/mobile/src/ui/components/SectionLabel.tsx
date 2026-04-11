import React from "react";
import { Text, StyleSheet } from "react-native";
import { theme } from "../theme";

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: {
    color: theme.color.muted,
    ...theme.typography.label,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
});