// apps/mobile/src/features/dashboard/DashboardTopBar.tsx


import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import { theme } from "../../ui/theme";
// import Icon from 'react-native-vector-icons/Ionicons';
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";




type DashboardTopBarProps = {
    teacherName?: string | null;
    teacherRoleTitle?: string | null;
    onPressNotifications?: () => void
};

export function DashboardTopBar(props: DashboardTopBarProps) {
    const { teacherName, teacherRoleTitle, onPressNotifications } = props;

    return (
        <SafeAreaView edges={["top"]}>
            <View
                style={styles.container}>
                <View
                    style={styles.leftHeader}>
                    <Image
                        source={require("../../../image/stemtrack-logo.png")}
                        style={styles.logo}
                    />
                    <Text style={styles.teacherName}>
                        {teacherName ?? "Unknown Teacher"}
                    </Text>
                    <Text style={styles.teacherRoleTitle}>
                        {teacherRoleTitle ?? "Teaching Session"}
                    </Text>
                </View>


                <Pressable onPress={onPressNotifications ?? (() => { })}
                    style={styles.notificationButton}
                    accessibilityRole="button"
                    accessibilityLabel="Open notifications"
                >

                    <Ionicons
                        name="notifications-outline" // or "notifications" for filled
                        size={20}
                        color="#0F172A"
                    />

                </Pressable>


            </View>
        </SafeAreaView>
    )
}




const styles = StyleSheet.create(
    {
        container: {
            marginBottom: theme.spacing.md,
            paddingTop: theme.spacing.sm,
            paddingBottom: theme.spacing.md,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
        },
        leftHeader: {
            flex: 1,
            gap: 6,
            alignSelf: "flex-start"
        },
        logo: {
            width: 96,
            height: 36,
            resizeMode: "contain",
            marginBottom: 4,
        },
        teacherName: {
            fontSize: 20,
            fontWeight: "800",
            color: theme.color.text,
        },
        teacherRoleTitle: {
            fontSize: 13,
            fontWeight: "500",
            color: theme.color.subtext,
        },
        notificationButton: {
            width: 42,
            height: 42,
            borderRadius: 999,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(15,23,42,0.08)",
            borderWidth: 1,
            borderColor: "rgba(15,23,42,0.10)",
            marginTop: 18,
        },
    }
);