import React from "react";
import { Pressable, Text, StyleSheet, ActivityIndicator } from "react-native";
import { theme } from "../theme";

type Variant = "primary" | "secondary" | "danger";

export function Button({
  label,
  onPress,
  disabled,
  loading,
  variant = "primary",
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
}) {
  const isDisabled = !!disabled || !!loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Text style={[styles.text, textStyles[variant]]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  pressed: { opacity: 0.9 },
  disabled: { opacity: 0.6 },
  text: { fontSize: 16, fontWeight: "700" },
});

const variantStyles: Record<Variant, any> = {
  primary: {
    backgroundColor: theme.color.primary,
    borderColor: theme.color.primary,
  },
  secondary: {
    backgroundColor: theme.color.surface,
    borderColor: theme.color.border,
  },
  danger: {
    backgroundColor: "#FFF1F3",
    borderColor: "#FDA4AF",
  },
};

const textStyles: Record<Variant, any> = {
  primary: { color: "white" },
  secondary: { color: theme.color.text },
  danger: { color: theme.color.danger },
};