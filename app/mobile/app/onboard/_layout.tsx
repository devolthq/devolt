import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { StatusBar } from "react-native";

SplashScreen.preventAutoHideAsync();

export default function OnboardLayout() {
	const colorScheme = useColorScheme();

	return (
		<ThemeProvider
			value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
		>
			<StatusBar barStyle="light-content" />
			<Stack
				screenOptions={{
					headerShown: false,
				}}
			>
				<Stack.Screen name="index" options={{ title: "Onboarding" }} />
				<Stack.Screen
					name="step-2/index"
					options={{ title: "Step 2" }}
				/>
			</Stack>
		</ThemeProvider>
	);
}
