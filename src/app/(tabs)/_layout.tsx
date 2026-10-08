import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { ColorValue } from "react-native";
import { colors } from "@/core/theme";

type IconName = keyof typeof Ionicons.glyphMap;

function icon(bold: IconName, outline: IconName) {
	function TabBarIcon({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) {
		return <Ionicons name={focused ? bold : outline} size={size} color={color} />;
	}
	TabBarIcon.displayName = `TabBarIcon(${bold})`;
	return TabBarIcon;
}

/**
 * Navigasi utama (PRD mobile Bag. 4): Beranda · Presensi · Pengajuan · Lainnya.
 * Tahap M1 mengisi Beranda, Presensi, dan Lainnya (Jadwal); Pengajuan menyusul di M2.
 */
export default function TabsLayout() {
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: colors.primary,
				tabBarInactiveTintColor: colors.textMuted,
				tabBarStyle: { borderTopColor: colors.border, backgroundColor: colors.surface },
			}}
		>
			<Tabs.Screen
				name="index"
				options={{ title: "Beranda", tabBarIcon: icon("home", "home-outline") }}
			/>
			<Tabs.Screen
				name="attendance"
				options={{ title: "Presensi", tabBarIcon: icon("time", "time-outline") }}
			/>
			<Tabs.Screen
				name="requests"
				options={{ title: "Pengajuan", tabBarIcon: icon("document-text", "document-text-outline") }}
			/>
			<Tabs.Screen
				name="more"
				options={{ title: "Lainnya", tabBarIcon: icon("menu", "menu-outline") }}
			/>
		</Tabs>
	);
}
