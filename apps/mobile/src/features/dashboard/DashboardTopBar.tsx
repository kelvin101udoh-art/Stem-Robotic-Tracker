// apps/mobile/src/features/dashboard/DashboardTopBar.tsx


import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import { theme } from "../../ui/theme";
// import Icon from 'react-native-vector-icons/Ionicons';
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";




type DashboardTopBarProps = {
    teacherName?: string | null;

    onPressNotifications?: () => void
};

/* export function DashboardTopBar(props: DashboardTopBarProps) {
    const { teacherName, teacherRoleTitle, onPressNotifications } = props;

    return (
        <View style={styles.container}>
            <View style={styles.brandRow}>
                <Image
                    source={require("../../../image/stemtrack-logo.png")}
                    style={styles.logo}
                />

                <Pressable
                    onPress={onPressNotifications ?? (() => { })}
                    style={styles.notificationButton}
                    accessibilityRole="button"
                    accessibilityLabel="Open notifications"
                >
                    <Ionicons
                        name="notifications-outline"
                        size={22}
                        color="#0F172A"
                    />
                </Pressable>
            </View>

            <View style={styles.identityBlock}>
                <Text style={styles.welcomeText}>Welcome back</Text>

                <Text style={styles.teacherName}>
                    {teacherName ?? "Unknown Teacher"}
                </Text>

                <Text style={styles.teacherRoleTitle}>
                    {teacherRoleTitle ?? "Teaching Session"}
                </Text>
            </View>
        </View>
    )
} */

export function DashboardBrandBar({ onPressNotifications }: DashboardTopBarProps) {
    return (
        <View style={styles.card}>
            <View style={styles.brandRow}>

                <Image
                    source={require("../../../image/stemtrack-logo-removebg.png")}
                    style={styles.logo}
                />

                <Pressable
                    onPress={onPressNotifications ?? (() => { })}
                    style={styles.notificationButton}
                >
                    <Ionicons name="notifications-outline" size={22} color="#0F172A" />
                </Pressable>
            </View>
        </View>
    );
}

export function DashboardIdentityHeader({
    teacherName,

}: DashboardTopBarProps) {
    return (
        <View style={styles.identityBlock}>
            <Text style={styles.welcomeText}>Welcome back</Text>
            <Text style={styles.teacherName}>{teacherName ?? "Unknown Teacher"}</Text>

        </View>
    );
}



const styles = StyleSheet.create({
    container: {
        marginBottom: theme.spacing.lg,
        paddingTop: theme.spacing.sm,
        paddingBottom: theme.spacing.md,
    },

    card: {
       // backgroundColor: "white",
        borderRadius: 16, // Smoother rounded corners
        padding: theme.spacing.s,
        // Using a very subtle border + soft shadow for a "Float" look
        borderWidth: 0,
        borderColor: "#F1F5F9",
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.04,
        shadowRadius: 20,
        // elevation: 3,
        marginBottom: theme.spacing.s,
    },

    brandRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },


    /* brandRow: {
        backgroundColor: "white",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: theme.spacing.lg,
    }, */



    logo: {
        width: 100, // Slightly larger for clarity
        height: 90,
        resizeMode: "contain",
        backgroundColor: "transparent",
    },

    notificationButton: {
        width: 44,
        height: 44,
        borderRadius: 12, // Squircle shape is very modern
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F8FAFC", // Off-white background
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },

    identityBlock: {
        gap: 2, // Tighter gap for better grouping
        paddingHorizontal: theme.spacing.md,
        marginTop: -25,
    },

    welcomeText: {
        fontSize: 13,
        fontWeight: "700",
        color: theme.color.subtext,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },

    teacherName: {
        fontSize: 20, // Bold and large
        lineHeight: 38,
        fontWeight: "900",
        color: theme.color.text,
        letterSpacing: -0.5, // Tightening large text looks more "designed"
    },

});