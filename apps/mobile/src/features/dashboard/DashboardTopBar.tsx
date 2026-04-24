// apps/mobile/src/features/dashboard/DashboardTopBar.tsx


import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import { theme } from "../../ui/theme";
import Icon from 'react-native-vector-icons/Ionicons';




type DashboardTopBarProps = {
    teacherName?: string | null;
    teacherRoleTitle?: string | null;
    onPressNotifications?: () => void
};

export function DashboardTopBar(props: DashboardTopBarProps) {
    const { teacherName, teacherRoleTitle, onPressNotifications } = props;

    return (
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

                <Icon
                    name="notifications-outline" // or "notifications" for filled
                    size={20}
                    color="#FFFFFF"
                />

            </Pressable>


        </View>
    )
}




const styles = StyleSheet.create(
    {
        container: {
            marginBottom: theme.spacing.sm,
            paddingVertical: theme.spacing.sm,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",

        },
        leftHeader: {
            flex: 1,
            gap: 6,
            alignSelf: "flex-start"
        },
        logo: {
            width: 120,
            height: 42,
            resizeMode: "contain"
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
            backgroundColor: "rgba(255,255,255,0.08)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.12)",
        },
    }
);