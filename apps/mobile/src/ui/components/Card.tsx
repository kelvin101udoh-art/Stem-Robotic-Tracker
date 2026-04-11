import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { theme } from "../theme";

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.color.border,
    padding: theme.spacing.lg,
    ...theme.shadow.card,
  },
});