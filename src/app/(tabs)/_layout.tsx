import { StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { ColorValue } from "react-native";
import { colors, spacing } from "@/core/theme";

type IconName = keyof typeof Ionicons.glyphMap;

function ikon(bold: IconName, outline: IconName) {
	function TabBarIcon({
		color,
		size,
		focused,
	}: {
		color: ColorValue;
		size: number;
		focused: boolean;
	}) {
		return <Ionicons name={focused ? bold : outline} size={size} color={color} />;
	}
	TabBarIcon.displayName = `TabBarIcon(${bold})`;
	return TabBarIcon;
}

/**
 * Navigasi utama (PRD mobile Bag. 4):
 * Beranda · Presensi · Pengajuan · Jadwal · Lainnya.
 */
export default function TabsLayout() {
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: colors.primary,
				tabBarInactiveTintColor: colors.textMuted,
				tabBarStyle: styles.bar,
				tabBarLabelStyle: styles.label,
				tabBarHideOnKeyboard: true,
			}}
		>
			<Tabs.Screen
				name="index"
				options={{ title: "Beranda", tabBarIcon: ikon("home", "home-outline") }}
			/>
			<Tabs.Screen
				name="attendance"
				options={{ title: "Presensi", tabBarIcon: ikon("time", "time-outline") }}
			/>
			<Tabs.Screen
				name="requests"
				options={{ title: "Pengajuan", tabBarIcon: ikon("document-text", "document-text-outline") }}
			/>
			<Tabs.Screen
				name="schedule"
				options={{ title: "Jadwal", tabBarIcon: ikon("calendar", "calendar-outline") }}
			/>
			<Tabs.Screen
				name="more"
				options={{ title: "Lainnya", tabBarIcon: ikon("apps", "apps-outline") }}
			/>
		</Tabs>
	);
}

const styles = StyleSheet.create({
	bar: {
		height: 68,
		paddingTop: spacing.xs,
		paddingBottom: spacing.xs,
		borderTopWidth: 1,
		borderTopColor: colors.border,
		backgroundColor: colors.surface,
	},
	label: { fontSize: 11, fontWeight: "600" },
});
