import React, { useEffect, useState } from "react";
import {
	View,
	Text,
	TextInput,
	Pressable,
	StyleSheet,
	Alert,
} from "react-native";
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
} from "react-native-reanimated";
import { router } from "expo-router";
import { login } from "@/services/authService";

export default function Login() {
	const [email, setEmail] = useState("producer@email.com");
	const [password, setPassword] = useState("password");

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

	const handleLogin = async () => {
		try {
			const response = await login(email, password);
			// Alert.alert("Success", `Welcome back ${response.user.name}!`);
			router.replace("/");
		} catch (error) {
			Alert.alert("Error", error.message);
		}
	};

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

				<Pressable style={styles.loginButton} onPress={handleLogin}>
					<Text style={styles.buttonLabel}>Login</Text>
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
