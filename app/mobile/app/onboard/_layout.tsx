import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/hooks/useAuth";
import { StatusBar } from "expo-status-bar";

SplashScreen.preventAutoHideAsync();

export default function OnboardLayout() {
	const colorScheme = useColorScheme();

	const { isLoggedIn, isLoading } = useAuth();

	useEffect(() => {
		if (!isLoading) {
			if (isLoggedIn) {
				router.replace("/home");
			}
		}
	}, [isLoggedIn, isLoading]);

	return (
		<Stack
			screenOptions={{
				headerShown: false,
			}}
		>
			<Stack.Screen name="onboard" options={{ title: "Onboarding" }} />
			<Stack.Screen name="step-2/step-2" options={{ title: "Step 2" }} />
		</Stack>
	);
}
