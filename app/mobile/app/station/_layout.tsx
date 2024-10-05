import { useFonts } from "expo-font";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { Pressable, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "@/hooks/useAuth";

SplashScreen.preventAutoHideAsync();

export default function StationLayout() {
	const colorScheme = useColorScheme();
	const { isLoggedIn, isLoading } = useAuth();

	useEffect(() => {
		console.log("isLoggedIn: ", isLoggedIn, "isLoading: ", isLoading);

		if (!isLoading && isLoggedIn) {
			router.replace("/");
		}
	}, [isLoggedIn, isLoading]);

	return (
		<Stack
			screenOptions={{
				headerShown: false,
			}}
		>
			<Stack.Screen name="[id]" options={{ title: "Station" }} />
		</Stack>
	);
}

const styles = StyleSheet.create({
	backButton: {
		marginLeft: 15,
	},
});
