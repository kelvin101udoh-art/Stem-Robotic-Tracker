import { useState } from "react";
import { Text, View, TextInput } from "react-native";
import { Screen } from "../src/ui/components/Screen";
import { Card } from "../src/ui/components/Card";
import { Button } from "../src/ui/components/Button";
import { theme } from "../src/ui/theme";
import { useRequireSession } from "../src/hooks/useRequireSession";

export default function EvidenceScreen() {
  const { sessionToken, clubId } = useRequireSession();

  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");

  async function onTakePhoto() {
    // TODO: integrate expo-image-picker
    setMessage("Photo captured (mock).");
  }

  async function onUpload() {
    if (!sessionToken) return;

    const metadata = {
      club_id: clubId,
      session_id: null,
      student_id: null,
      note,
      captured_at: new Date().toISOString(),
      kind: "photo",
    };

    // TODO: send to evidence-client
    console.log("Uploading evidence with metadata:", metadata);

    setMessage("Evidence submitted successfully.");
  }

  return (
    <Screen>
      <Card>
        <View style={{ gap: theme.spacing.md }}>
          <Text style={{ fontSize: 22, fontWeight: "800" }}>
            Capture Evidence
          </Text>

          <Text style={{ color: theme.color.subtext }}>
            Attach visual evidence to this session. Add context for AI and reporting.
          </Text>

          <Button label="Take Photo" onPress={onTakePhoto} />

          <TextInput
            placeholder="Add optional note (e.g. student built working circuit)"
            value={note}
            onChangeText={setNote}
            style={{
              borderWidth: 1,
              borderColor: theme.color.border,
              padding: 12,
              borderRadius: theme.radius.md,
              backgroundColor: theme.color.surface,
            }}
          />

          <Button label="Upload Evidence" onPress={onUpload} />

          {!!message && <Text>{message}</Text>}
        </View>
      </Card>
    </Screen>
  );
}