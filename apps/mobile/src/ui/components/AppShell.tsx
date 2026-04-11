import React from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { theme } from "../theme";

export function AppShell({
  children,
  centered = false,
}: {
  children: React.ReactNode;
  centered?: boolean;
}) {
  const { width } = useWindowDimensions();
  const maxWidth = width >= 1024 ? 720 : width >= 768 ? 620 : 9999;

  return (
    <View style={[styles.root, centered && styles.centered]}>
      <View style={[styles.inner, { maxWidth }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.color.bg,
    padding: theme.spacing.lg,
    alignItems: "center",
  },
  centered: {
    justifyContent: "center",
  },
  inner: {
    width: "100%",
    gap: theme.spacing.md,
  },
});