import { useFonts } from "expo-font";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { Pressable, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "@/hooks/useAuth";

SplashScreen.preventAutoHideAsync();

export default function StationLayout() {
	return (
		<Stack
			screenOptions={{
				headerStyle: {
					backgroundColor: "#101010",
				},
				header: () => (
					<Pressable
						style={styles.backButton}
						onPress={() => {
							router.back();
						}}
					>
						<Ionicons name="arrow-back" size={24} color="#fff" />
					</Pressable>
				),
				headerTitle: "",
			}}
		>
			<Stack.Screen name="[id]" />
		</Stack>
	);
}

const styles = StyleSheet.create({
	backButton: {
		position: "absolute",
		marginTop: 80,
		top: 0,
		left: 20,
		padding: 4,
		backgroundColor: "#101010",
		borderRadius: 10,
	},
});
