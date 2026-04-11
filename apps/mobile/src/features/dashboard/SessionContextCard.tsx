import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Card } from "../../ui/components/Card";
import { theme } from "../../ui/theme";

export function SessionContextCard({
  clubName,
  clubId,
  sessionId,
  expiresAt,
}: {
  clubName?: string | null;
  clubId?: string | null;
  sessionId?: string | null;
  expiresAt?: string | null;
}) {
  return (
    <Card>
      <View style={styles.stack}>
        <Text style={styles.label}>Active Session Context</Text>

        <View style={styles.grid}>
          <View style={styles.item}>
            <Text style={styles.itemLabel}>Club</Text>
            <Text style={styles.itemValue}>{clubName ?? "Unknown club"}</Text>
          </View>

          <View style={styles.item}>
            <Text style={styles.itemLabel}>Club ID</Text>
            <Text style={styles.itemValue}>{clubId ?? "Unavailable"}</Text>
          </View>

          <View style={styles.item}>
            <Text style={styles.itemLabel}>Session ID</Text>
            <Text style={styles.itemValue}>{sessionId ?? "Pending"}</Text>
          </View>

          <View style={styles.item}>
            <Text style={styles.itemLabel}>Access Expires</Text>
            <Text style={styles.itemValue}>
              {expiresAt ? new Date(expiresAt).toLocaleString() : "Unavailable"}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: theme.spacing.md,
  },
  label: {
    color: theme.color.primaryText,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  grid: {
    gap: theme.spacing.md,
  },
  item: {
    gap: 4,
  },
  itemLabel: {
    color: theme.color.muted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  itemValue: {
    color: theme.color.text,
    fontSize: 15,
    fontWeight: "600",
  },
});