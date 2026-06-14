// apps/mobile/src/ui/components/modetile.tsx
import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { theme } from "../theme";
import { Ionicons } from "@expo/vector-icons"; // Added for the chevron

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
      // Use 'any' as a quick fix or define the style object clearly
      style={({ pressed }: { pressed: boolean }) => [
        styles.tile,
        pressed && styles.pressed
      ]}
    >
      {/* Icon on the left */}
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{icon}</Text>
      </View>

      {/* Text in the middle */}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
      </View>

      {/* Arrow on the right */}
      <View style={styles.actionArea}>
        <Ionicons name="chevron-forward" size={18} color={theme.color.subtext} />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({



  // modetile.tsx styles
  tile: {
    backgroundColor: 'white',
    borderRadius: 24,
    paddingVertical: 32,    // Much taller cards
    paddingHorizontal: 24,  // More breathing room on sides
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    elevation: 4,           // Stronger shadow for depth
  },
  iconWrap: {
    width: 64,              // Bigger icon box
    height: 64,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    marginRight: 20,        // More space before text starts
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,           // Bigger, bolder title
    fontWeight: "900",
    color: "#0F172A",
  },
  description: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
    lineHeight: 20,         // Better spacing between lines
  },


  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }], // Makes the card "shrink" slightly when tapped
  },

  actionArea: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.3, // Keeps the arrow subtle
  },

  // Ensure 'content' exists too so the text doesn't hit the arrow
  content: {
    flex: 1,
    paddingRight: 10,
  },


  icon: {
    fontSize: 32,     // Bigger emojis/icons
  },


  // ... rest of actionArea
});

