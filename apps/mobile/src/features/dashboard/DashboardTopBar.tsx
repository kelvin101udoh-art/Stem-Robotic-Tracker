// apps/mobile/src/features/dashboard/DashboardTopBar.tsx


import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import { theme } from "../../ui/theme";
import Icon from 'react-native-vector-icons/Ionicons';




type DashboardTopBarProps = {
    teacherName?: string | null;
    teacherRoleTitle?: string | null;
    onPressNotifications?: () => void
}

export function DashboardTopBar(props: DashboardTopBarProps) {
    const teacherName = props.teacherName;
    const teacherRoleTitle = props.teacherRoleTitle;
    const onPressNotifications = props.onPressNotifications
    return (
        <View
            style={style.container}>
            <View
               style={style.leftHeader}>
                <Image
                    source={require("../../../image/stemtrack-logo.png")}
                    style={style.logo}
                />
                <Text style={style.teacherName}>
                    {teacherName ?? "Unknown Teacher"}
                </Text>
                <Text style={style.teacherRoleTitle}>
                    {teacherRoleTitle ?? "Teaching Session"}
                </Text>
            </View>

            <View >
                <Pressable onPress={onPressNotifications} style={style.notificationButton}>

                    <Icon
                        name="notifications-outline" // or "notifications" for filled
                        size={20}
                        color="#FFFFFF"
                    />

                </Pressable>
            </View>

        </View>
    )
}




const style = StyleSheet.create(
    {
        container: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start"
        },
        leftHeader: {
            flex: 1,
            gap: 10
        },
        logo: {
            width: 50,
            height: 40,
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
)