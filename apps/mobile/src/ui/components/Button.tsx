import React from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from "react-native";
import { theme } from "../theme";

type Variant = "primary" | "secondary" | "danger";

export function Button({
  label,
  onPress,
  disabled,
  loading,
  variant = "primary",
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  style?: ViewStyle;
}) {
  const isDisabled = !!disabled || !!loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#FFFFFF" : theme.color.text} />
      ) : (
        <Text style={[styles.text, textStyles[variant]]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
  },
  text: {
    ...theme.typography.button,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
  disabled: {
    opacity: 0.55,
  },
});

const variantStyles: Record<Variant, ViewStyle> = {
  primary: {
    backgroundColor: theme.color.primary,
    borderColor: theme.color.primary,
  },
  secondary: {
    backgroundColor: theme.color.surface,
    borderColor: theme.color.borderStrong,
  },
  danger: {
    backgroundColor: theme.color.dangerSoft,
    borderColor: "#FDA29B",
  },
};

const textStyles: Record<Variant, object> = {
  primary: { color: "#FFFFFF" },
  secondary: { color: theme.color.text },
  danger: { color: theme.color.danger },
};