import { useAuth } from "@/hooks/useAuth";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import {
	View,
	Text,
	ActivityIndicator,
	StyleSheet,
	FlatList,
	Dimensions,
	Pressable,
	TextInput,
	StatusBar,
} from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";
import Animated, {
	useAnimatedGestureHandler,
	useSharedValue,
	withSpring,
	useAnimatedStyle,
} from "react-native-reanimated";
import { sharedStyles } from "../_layout";

export default function Profile() {
	const { isLoggedIn, isLoading, logout } = useAuth();
	const hasNavigatedRef = useRef(false);

	// useEffect(() => {
	// 	if (!isLoading && !hasNavigatedRef.current) {
	// 		hasNavigatedRef.current = true;
	// 		if (!isLoggedIn) {
	// 			router.replace("/");
	// 		}
	// 	}
	// }, [isLoading, isLoggedIn]);

	// if (isLoading) {
	// 	return (
	// 		<View style={styles.container}>
	// 			<ActivityIndicator size="large" color="#e1e1e1" />
	// 		</View>
	// 	);
	// }

	return (
		<View style={styles.container}>
			<StatusBar barStyle="light-content" />
			<Pressable onPress={() => router.back()} style={styles.backButton}>
				<Ionicons name="arrow-back" size={24} color="#fff" />
			</Pressable>
			<View>
				<Text
					style={{
						color: "#fff",
						fontSize: 18,
						fontWeight: "300",
						textAlign: "center",
						marginBottom: 20,
					}}
				>
					Map Placeholder
				</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		display: "flex",
		flexDirection: "column",
		backgroundColor: "#000",
		alignContent: "center",
		justifyContent: "center",
	},
	backButton: {
		position: "absolute",
		top: 60,
		left: 20,
	},
});
