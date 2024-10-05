import React, { useEffect, useState } from "react";
import {
	View,
	Text,
	TextInput,
	Pressable,
	StyleSheet,
	Alert,
	ActivityIndicator,
} from "react-native";
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
} from "react-native-reanimated";
import { router } from "expo-router";
import { login } from "@/services/authService";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
	const [email, setEmail] = useState("producer@email.com");
	const [password, setPassword] = useState("password");
	const [isLoading, setIsLoading] = useState(false);

	const fadeAnim = useSharedValue(0);
	const slideAnim = useSharedValue(300);

	useEffect(() => {
		fadeAnim.value = withTiming(1, { duration: 750 });
		slideAnim.value = withTiming(0, { duration: 750 });
	}, [fadeAnim, slideAnim]);

	const fadeStyle = useAnimatedStyle(() => ({
		opacity: fadeAnim.value,
	}));

	const slideStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: slideAnim.value }],
	}));

	const { isLoggedIn, login } = useAuth();

	const handleLogin = async () => {
		setIsLoading(true);
		try {
			await login(email, password);
		} catch (error) {
			Alert.alert("Error", error.message);
			console.error("Login error:", error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (!isLoading) {
			if (isLoggedIn) {
				router.replace("/");
			} else {
				// router.replace("/onboard");
			}
		}
	}, [isLoggedIn, isLoading]);

	return (
		<View style={styles.container}>
			<Animated.View
				style={[styles.formContainer, fadeStyle, slideStyle]}
			>
				<Text style={styles.title}>Login</Text>

				<TextInput
					style={styles.input}
					placeholder="Email"
					placeholderTextColor="#aaa"
					value={email}
					onChangeText={setEmail}
					keyboardType="email-address"
				/>

				<TextInput
					style={styles.input}
					placeholder="Password"
					placeholderTextColor="#aaa"
					value={password}
					onChangeText={setPassword}
					secureTextEntry
				/>

				<Pressable
					style={styles.loginButton}
					onPress={handleLogin}
					disabled={isLoading}
				>
					{isLoading ? (
						<ActivityIndicator size="small" color="#1e1e1e" />
					) : (
						<Text style={styles.buttonLabel}>Login</Text>
					)}
				</Pressable>

				<Pressable onPress={() => router.push("/signup")}>
					<Text style={styles.signupText}>
						Don't have an account? Sign up
					</Text>
				</Pressable>
			</Animated.View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
		backgroundColor: "#000",
	},
	formContainer: {
		width: "100%",
		alignItems: "center",
	},
	title: {
		fontSize: 32,
		fontWeight: "600",
		color: "#fff",
		marginBottom: 20,
	},
	input: {
		width: "90%",
		height: 50,
		backgroundColor: "#1e1e1e",
		borderRadius: 5,
		marginBottom: 20,
		paddingHorizontal: 15,
		color: "#fff",
		fontSize: 18,
	},
	loginButton: {
		backgroundColor: "#42FF4E",
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 5,
		alignItems: "center",
		justifyContent: "center",
		width: "90%",
		marginBottom: 20,
	},
	buttonLabel: {
		fontSize: 18,
		color: "#000",
		fontWeight: "600",
	},
	signupText: {
		color: "#42FF4E",
		fontSize: 16,
	},
});
