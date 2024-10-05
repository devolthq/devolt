import { useAuth } from "@/hooks/useAuth";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import {
	View,
	Text,
	ActivityIndicator,
	StyleSheet,
	StatusBar,
	Pressable,
} from "react-native";

export default function Page() {
	const { isLoggedIn, isLoading, logout } = useAuth();
	const hasNavigatedRef = useRef(false);

	if (isLoading) {
		return (
			<View style={styles.container}>
				<ActivityIndicator size="large" color="#e1e1e1" />
			</View>
		);
	}

	useEffect(() => {
		console.log("isLoading:", isLoading, "isLoggedIn:", isLoggedIn);
		if (!isLoading && !hasNavigatedRef.current) {
			hasNavigatedRef.current = true;
			if (!isLoggedIn) {
				console.log("Navigating to /onboard");
				router.replace("/onboard");
			}
		}
	}, [isLoading]);

	return (
		<View style={styles.container}>
			<Text style={styles.text}>Hello, world!</Text>

			<Pressable
				onPress={() => {
					logout();
				}}
			>
				<Text style={styles.text}>Logout</Text>
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#000",
	},
	text: {
		color: "#fff",
	},
});
