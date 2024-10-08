import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { Pressable, StatusBar, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

SplashScreen.preventAutoHideAsync();

export default function SignUpLayout() {
	const colorScheme = useColorScheme();

	return (
		<ThemeProvider
			value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
		>
			<StatusBar barStyle="light-content" />
			<Stack
				screenOptions={{
					headerStyle: {
						backgroundColor: "#101010",
					},
					headerLeft: () => (
						<Pressable
							style={styles.backButton}
							onPress={() => {
								router.push("/onboard");
							}}
						>
							<Ionicons
								name="arrow-back"
								size={24}
								color="#fff"
							/>
						</Pressable>
					),
					headerTitle: "",
				}}
			>
				<Stack.Screen name="signup" options={{}} />
			</Stack>
		</ThemeProvider>
	);
}

const styles = StyleSheet.create({
	backButton: {
		marginLeft: 15,
	},
});
