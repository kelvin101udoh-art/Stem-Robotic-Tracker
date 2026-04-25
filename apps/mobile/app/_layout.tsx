import { Stack } from "expo-router";

/* export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerTitleAlign: "center",
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: "STEMTrack" }} />
      <Stack.Screen name="home" options={{ title: "Capture Dashboard" }} />
      <Stack.Screen
        name="capture-learning"
        options={{ title: "Capture Learning" }}
      />
      <Stack.Screen name="attendance" options={{ title: "Attendance" }} />
      <Stack.Screen name="evidence" options={{ title: "Capture Evidence" }} />
    </Stack>
  );
} */

 
export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}