// stem-robotic-tracker-monorepo/apps/mobile/app/attendance.tsx

import { useState } from "react";
import { Text, View, Pressable, StyleSheet } from "react-native";
import { Screen } from "../src/ui/components/Screen";
import { Card } from "../src/ui/components/Card";
import { Button } from "../src/ui/components/Button";
import { theme } from "../src/ui/theme";
import { useRequireSession } from "../src/hooks/useRequireSession";
import { AttendanceVoiceReviewModal } from "../src/features/attendance/AttendanceVoiceReviewModal";
import type { AttendanceVoiceCandidateDto } from "@stemtrack/sdk";

type Student = {
  id: string;
  name: string;
  present: boolean;
};

const initialStudents: Student[] = [
  { id: "1", name: "John Doe", present: false },
  { id: "2", name: "Sarah Lee", present: false },
  { id: "3", name: "Michael Brown", present: false },
  { id: "4", name: "Aisha Khan", present: false },
];

export default function AttendanceScreen() {
  const { sessionToken } = useRequireSession();

  const [students, setStudents] = useState(initialStudents);
  const [message, setMessage] = useState("");
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);

  // MOCK voice detection result (replace later with real API)
  const [voiceCandidates, setVoiceCandidates] = useState<AttendanceVoiceCandidateDto[]>([
    {
      spoken_text: "john doe present",
      matched_student_id: "1",
      matched_student_name: "John Doe",
      status: "matched",
      confidence: 0.98,
    },
    {
      spoken_text: "sarah present",
      matched_student_id: "2",
      matched_student_name: "Sarah Lee",
      status: "matched",
      confidence: 0.91,
    },
  ]);

  function togglePresent(id: string) {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, present: !s.present } : s))
    );
  }

  function markAllPresent() {
    setStudents((prev) => prev.map((s) => ({ ...s, present: true })));
  }

  function openVoiceMode() {
    // later: start recording + send to API
    setVoiceModalVisible(true);
  }

  function confirmVoiceAttendance() {
    setStudents((prev) =>
      prev.map((s) => {
        const match = voiceCandidates.find((v) => v.matched_student_id === s.id);
        return match ? { ...s, present: true } : s;
      })
    );

    setVoiceModalVisible(false);
    setMessage("Voice attendance applied successfully.");
  }

  function submitAttendance() {
    if (!sessionToken) return;

    const payload = {
      students: students.map((s) => ({
        student_id: s.id,
        present: s.present,
      })),
    };

    // TODO: call attendance-client API here
    setMessage(
      `Attendance ready. ${payload.students.filter((s) => s.present).length} present.`
    );
  }

  return (
    <Screen>
      <Card>
        <View style={{ gap: theme.spacing.md }}>
          <Text style={styles.title}>Attendance</Text>

          <Text style={styles.subtitle}>
            Manual attendance is primary. Voice is reviewed before confirmation.
          </Text>

          <View style={{ gap: theme.spacing.sm }}>
            {students.map((student) => (
              <Pressable
                key={student.id}
                onPress={() => togglePresent(student.id)}
                style={[styles.row, student.present && styles.rowActive]}
              >
                <Text style={styles.name}>{student.name}</Text>
                <Text style={[styles.state, student.present && styles.stateActive]}>
                  {student.present ? "Present" : "Absent"}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={{ gap: theme.spacing.sm }}>
            <Button
              label="Mark All Present"
              variant="secondary"
              onPress={markAllPresent}
            />

            <Button
              label="Use Voice Attendance"
              onPress={openVoiceMode}
            />

            <Button
              label="Submit Attendance"
              onPress={submitAttendance}
            />
          </View>

          {!!message && <Text>{message}</Text>}
        </View>
      </Card>

      <AttendanceVoiceReviewModal
        visible={voiceModalVisible}
        candidates={voiceCandidates}
        onClose={() => setVoiceModalVisible(false)}
        onConfirm={confirmVoiceAttendance}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.color.text,
  },
  subtitle: {
    color: theme.color.subtext,
    lineHeight: 20,
  },
  row: {
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.md,
    padding: 14,
    backgroundColor: theme.color.surface,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rowActive: {
    borderColor: "#93C5FD",
    backgroundColor: "#EFF6FF",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
  },
  state: {
    fontWeight: "700",
    color: theme.color.muted,
  },
  stateActive: {
    color: theme.color.success,
  },
});