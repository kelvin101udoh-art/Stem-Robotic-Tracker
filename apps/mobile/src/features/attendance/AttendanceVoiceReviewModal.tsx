import React from "react";
import { Modal, View, Text, StyleSheet, ScrollView } from "react-native";
import { Button } from "../../ui/components/Button";
import { Card } from "../../ui/components/Card";
import { theme } from "../../ui/theme";
import type { AttendanceVoiceCandidateDto } from "@stemtrack/sdk";

export function AttendanceVoiceReviewModal({
  visible,
  candidates,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  candidates: AttendanceVoiceCandidateDto[];
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <Card style={styles.modalCard}>
          <View style={styles.stack}>
            <Text style={styles.title}>Voice Attendance Review</Text>
            <Text style={styles.subtitle}>
              Review detected names before saving attendance.
            </Text>

            <ScrollView style={styles.list}>
              {candidates.map((item, index) => (
                <View key={`${item.spoken_text}-${index}`} style={styles.row}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.primary}>
                      {item.matched_student_name ?? "No student matched"}
                    </Text>
                    <Text style={styles.secondary}>
                      Heard: {item.spoken_text}
                    </Text>
                  </View>

                  <Text style={styles.status}>{item.status}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.actions}>
              <Button label="Close" variant="secondary" onPress={onClose} />
              <Button label="Confirm Attendance" onPress={onConfirm} />
            </View>
          </View>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.35)",
    justifyContent: "center",
    padding: theme.spacing.lg,
  },
  modalCard: {
    maxHeight: "80%",
  },
  stack: {
    gap: theme.spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.color.text,
  },
  subtitle: {
    color: theme.color.subtext,
    fontSize: 15,
    lineHeight: 22,
  },
  list: {
    maxHeight: 320,
  },
  row: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.color.border,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  primary: {
    color: theme.color.text,
    fontSize: 15,
    fontWeight: "700",
  },
  secondary: {
    color: theme.color.subtext,
    fontSize: 13,
  },
  status: {
    color: theme.color.primaryText,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  actions: {
    gap: theme.spacing.sm,
  },
});