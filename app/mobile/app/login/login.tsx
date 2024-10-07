import React, { useEffect, useState } from "react";
import {
	View,
	Text,
	TextInput,
	Pressable,
	StyleSheet,
	Alert,
	ActivityIndicator,
	Image,
} from "react-native";
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
} from "react-native-reanimated";
import { router } from "expo-router";
import { login } from "@/services/authService";
import { useAuth } from "@/hooks/useAuth";
import deVoltLogo from "@/assets/images/devolt-logo.png";
import { Ionicons } from "@expo/vector-icons";

export default function Login() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState(/*"password"*/);
	const [isLoading, setIsLoading] = useState(false);

	const fadeAnim = useSharedValue(0);
	const slideAnim = useSharedValue(300);

	useEffect(() => {
		fadeAnim.value = withTiming(1, { duration: 500 });
		slideAnim.value = withTiming(0, { duration: 500 });
	}, [fadeAnim, slideAnim]);

	const fadeStyle = useAnimatedStyle(() => ({
		opacity: fadeAnim.value,
	}));

	const slideStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: slideAnim.value }],
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
				router.replace("/home");
			}
		}
		const randomEmail =
			// "matheus@email.com";
			"marcelo@email.com";
		// setEmail(randomEmail);
	}, [isLoggedIn, isLoading]);

	return (
		<View style={styles.container}>
			<Animated.View
				style={[styles.formContainer, fadeStyle, slideStyle]}
			>
				{/* <Image source={deVoltLogo} style={styles.logo} resizeMode="contain" /> */}

				<Text style={styles.title}>Login</Text>
				<Text style={styles.subtitle}>
					Welcome back! Please login to your account.
				</Text>

				<TextInput
					style={styles.input}
					placeholder="Email"
					placeholderTextColor="#aaa"
					value={email}
					onChangeText={setEmail}
					autoCapitalize="none"
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

				<View style={styles.divider} />

				<View style={{ flexDirection: "row", gap: 10 }}>
					<Ionicons
						name="logo-google"
						size={32}
						color="#fff"
						style={{ marginBottom: 20 }}
					/>
					<Ionicons
						name="logo-facebook"
						size={32}
						color="#fff"
						style={{ marginBottom: 20 }}
					/>
				</View>

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
		backgroundColor: "#101010",
	},
	formContainer: {
		width: "100%",
		alignItems: "center",
	},
	logo: {
		width: "100%",
		height: undefined,
		aspectRatio: 2,
		maxHeight: 200,
		marginBottom: 20,
	},
	title: {
		fontSize: 32,
		fontWeight: "600",
		color: "#fff",
		marginBottom: 20,
	},
	subtitle: {
		fontSize: 16,
		color: "#aaa",
		marginBottom: 20,
	},
	input: {
		width: "90%",
		height: 50,
		backgroundColor: "#000",
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
	divider: {
		width: "90%",
		height: 1,
		backgroundColor: "#333",
		marginVertical: 20,
	},
});
