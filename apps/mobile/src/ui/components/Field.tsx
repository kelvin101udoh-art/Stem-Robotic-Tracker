import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { theme } from "../theme";

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
        placeholderTextColor={theme.color.muted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: theme.color.subtext,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.md,
    padding: 14,
    fontSize: 16,
    backgroundColor: theme.color.surface,
    color: theme.color.text,
  },
});