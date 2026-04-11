import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { theme } from "../theme";

export function ModeTile({
  title,
  description,
  icon,
  onPress,
}: {
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <Text style={styles.launch}>Open</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.color.border,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    ...theme.shadow.card,
  },
  pressed: {
    opacity: 0.95,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.color.primarySoft,
  },
  icon: {
    fontSize: 22,
  },
  launch: {
    color: theme.color.primaryText,
    fontWeight: "800",
    fontSize: 13,
  },
  content: {
    gap: 6,
  },
  title: {
    color: theme.color.text,
    ...theme.typography.section,
  },
  description: {
    color: theme.color.subtext,
    ...theme.typography.body,
  },
});