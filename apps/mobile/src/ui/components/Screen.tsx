import React from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { theme } from "../theme";

export function Screen({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const maxWidth = width >= 768 ? 520 : 9999; // tablet center column

  return (
    <View style={styles.root}>
      <View style={[styles.container, { maxWidth }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.color.bg,
    padding: theme.spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    width: "100%",
  },
});