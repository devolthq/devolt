import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	Image,
	StyleSheet,
	Pressable,
	Dimensions,
	ActivityIndicator,
} from "react-native";
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
} from "react-native-reanimated";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";

const { width: screenWidth } = Dimensions.get("window");

export default function Onboard() {
	const [showFirstView, setShowFirstView] = useState(true);
	const [isLoading, setIsLoading] = useState(true);
	const fadeAnim = useSharedValue(1);
	const slideAnim = useSharedValue(0);
	const secondFadeAnim = useSharedValue(0);
	const secondSlideAnim = useSharedValue(50);

	useEffect(() => {
		const loadImages = async () => {
			await new Promise((resolve) => setTimeout(resolve, 500));
			setIsLoading(false);
		};

		loadImages();
	}, []);

	useEffect(() => {
		if (!isLoading) {
			const timer = setTimeout(() => {
				fadeAnim.value = withTiming(0, { duration: 500 });
				slideAnim.value = withTiming(-50, { duration: 500 });

				setTimeout(() => {
					setShowFirstView(false);
					secondFadeAnim.value = withTiming(1, { duration: 500 });
					secondSlideAnim.value = withTiming(0, { duration: 500 });
				}, 500);
			}, 1500);

			return () => clearTimeout(timer);
		}
	}, [isLoading, fadeAnim, slideAnim, secondFadeAnim, secondSlideAnim]);

	const firstAnimatedStyle = useAnimatedStyle(() => ({
		opacity: fadeAnim.value,
		transform: [{ translateX: slideAnim.value }],
	}));

	const secondAnimatedStyle = useAnimatedStyle(() => ({
		opacity: secondFadeAnim.value,
		transform: [{ translateX: secondSlideAnim.value }],
	}));

	if (isLoading) {
		return (
			<View style={styles.container}>
				<ActivityIndicator size="large" color="#1e1e1e" />
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<StatusBar style="inverted" />

			{showFirstView ? (
				<Animated.View
					style={[
						styles.animatedContainer,
						firstAnimatedStyle,
						{ justifyContent: "center" },
					]}
				>
					<Image
						source={require("@/assets/images/devolt-logo.png")}
						style={styles.logo}
						resizeMode="contain"
					/>
					<Text style={styles.semiBoldText}>
						Taking electric vehicles further.
					</Text>
				</Animated.View>
			) : (
				<Animated.View
					style={[styles.animatedContainer, secondAnimatedStyle]}
				>
					<View style={styles.textContainer}>
						<Text style={styles.semiBoldText}>
							Welcome to DeVolt
						</Text>
						<Text style={styles.headline}>
							A completely new way to use and trade energy, right
							at your fingertips.
						</Text>
						<Image source={require("@/assets/images/car.png")} />
					</View>

					<Pressable
						style={({ pressed }) => [
							styles.linkButton,
							pressed && styles.buttonPressed,
						]}
						onPress={() => router.push("/onboard/step-2/step-2")}
					>
						<Text style={styles.buttonLabel}>Next</Text>
					</Pressable>
				</Animated.View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
		backgroundColor: "#101010",
	},
	semiBoldText: {
		fontSize: 24,
		fontWeight: "600",
		marginBottom: 10,
		color: "#fff",
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
	animatedContainer: {
		height: "75%",
		display: "flex",
		justifyContent: "space-evenly",
		alignItems: "center",
		width: "100%",
	},
	logo: {
		width: screenWidth * 0.85,
		maxHeight: 200,
	},
	linkButton: {
		backgroundColor: "#42FF4E",
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 5,
		alignItems: "center",
		justifyContent: "center",
		width: "80%",
	},
	buttonLabel: {
		fontSize: 18,
		color: "#000",
	},
	buttonPressed: {
		opacity: 0.5,
	},
});
