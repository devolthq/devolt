import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, Pressable } from "react-native";
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	withDelay,
} from "react-native-reanimated";
import Outlet from "@/assets/images/outlet.png";
import { router } from "expo-router";

export default function Onboard() {
	const slideAnim = useSharedValue(300);
	const fadeAnim = useSharedValue(0);
	const [isSignupPressed, setIsSignupPressed] = useState(false);
	const [isLoginPressed, setIsLoginPressed] = useState(false);

	useEffect(() => {
		slideAnim.value = withTiming(0, { duration: 650 });
		fadeAnim.value = withDelay(250, withTiming(1, { duration: 750 }));
	}, []);

	const slideStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: slideAnim.value }],
	}));

	const fadeStyle = useAnimatedStyle(() => ({
		opacity: fadeAnim.value,
	}));

	return (
		<View style={styles.container}>
			<Animated.View
				style={[styles.textContainer, fadeStyle, slideStyle]}
			>
				<Text style={styles.semiBoldText}>We Revolutionize Power</Text>
				<Text style={styles.headline}>
					By connecting you directly to clean energy producers,
					enabling seamless buying and selling of renewable energy.
				</Text>

				<Image source={Outlet} style={styles.image} />
			</Animated.View>

			<Animated.View
				style={[styles.buttonContainer, fadeStyle, slideStyle]}
			>
				<Pressable
					style={({ pressed }) => [
						styles.signupButton,
						pressed && styles.buttonPressed,
					]}
					onPressIn={() => setIsSignupPressed(true)}
					onPressOut={() => setIsSignupPressed(false)}
					onPress={() => router.push("/signup")}
				>
					<Text
						style={[
							styles.buttonLabel,
							{
								color: "#ffffffbf",
							},
						]}
					>
						Sign up
					</Text>
				</Pressable>
				<Pressable
					style={({ pressed }) => [
						styles.loginButton,
						pressed && styles.buttonPressed,
					]}
					onPressIn={() => setIsLoginPressed(true)}
					onPressOut={() => setIsLoginPressed(false)}
					onPress={() => {
						router.push("/login");
					}}
				>
					<Text style={[styles.buttonLabel]}>Login</Text>
				</Pressable>
			</Animated.View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "space-evenly",
		alignItems: "center",
		paddingTop: 40,
		paddingVertical: 20,
		backgroundColor: "#000",
	},
	semiBoldText: {
		fontSize: 24,
		fontWeight: "600",
		marginBottom: 10,
		color: "#fff",
		textAlign: "center",
	},
	headline: {
		fontSize: 20,
		fontWeight: "300",
		marginBottom: 30,
		color: "#fff",
		textAlign: "center",
	},
	textContainer: {
		alignItems: "center",
	},
	image: {},
	buttonContainer: {
		width: "100%",
		alignItems: "center",
		gap: 10,
	},
	loginButton: {
		backgroundColor: "#42FF4E",
		borderWidth: 1,
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 5,
		alignItems: "center",
		justifyContent: "center",
		width: "90%",
	},
	signupButton: {
		backgroundColor: "#1e1e1e",
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 5,
		alignItems: "center",
		justifyContent: "center",
		width: "90%",
	},
	buttonLabel: {
		fontSize: 18,
		fontWeight: "400",
	},
	buttonPressed: {
		opacity: 0.5,
	},
});
