// apps/mobile/src/features/dashboard/SessionContextCard.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { BranchConfig, SessionContextDTO } from "stemtrack-sdk";
import { Card } from "../../ui/components/Card";
import { theme } from "../../ui/theme";

export function SessionContextCard({
  session,
  branchConfig,
}: {
  session?: SessionContextDTO | null;
  branchConfig?: BranchConfig | null;
}) {
  return (
    <Card>
      <View style={styles.stack}>
        <Text style={styles.label}>Active Session Context</Text>

        <View style={styles.grid}>
          <View style={styles.item}>
            <Text style={styles.itemLabel}>Branch</Text>
            <Text style={styles.itemValue}>
              {branchConfig?.displayName ?? session?.branch ?? "Unassigned"}
            </Text>
          </View>

          <View style={styles.item}>
            <Text style={styles.itemLabel}>Organisation</Text>
            <Text style={styles.itemValue}>
              {session?.organizationName ?? "Unavailable"}
            </Text>
          </View>

          <View style={styles.item}>
            <Text style={styles.itemLabel}>
              {branchConfig?.sessionTerm ?? "Session"} Name
            </Text>
            <Text style={styles.itemValue}>
              {session?.sessionName ?? "Pending"}
            </Text>
          </View>

          <View style={styles.item}>
            <Text style={styles.itemLabel}>Session ID</Text>
            <Text style={styles.itemValue}>
              {session?.sessionId ?? "Unavailable"}
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