import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	TextInput,
	Pressable,
	StyleSheet,
	Alert,
	ActivityIndicator,
} from "react-native";
import { signUp, login } from "@/services/authService";
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
} from "react-native-reanimated";
import { router } from "expo-router";

export default function Signup() {
	const [name, setName] = useState("John Doe");
	const [email, setEmail] = useState("john.doe@email.com");
	const [password, setPassword] = useState("password");
	const [loading, setLoading] = useState(false);

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

	const handleSignup = async () => {
		setLoading(true);
		try {
			const signupResponse = await signUp(name, email, password);
			Alert.alert("Success", `Welcome ${signupResponse.name}!`);
			const loginResponse = await login(email, password);
			router.replace("/home");
		} catch (error) {
			Alert.alert("Error", error.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={styles.container}>
			<Animated.View
				style={[styles.formContainer, fadeStyle, slideStyle]}
			>
				<Text style={styles.title}>Sign Up</Text>

				<TextInput
					style={styles.input}
					placeholder="Name"
					placeholderTextColor="#aaa"
					value={name}
					onChangeText={setName}
				/>

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
					style={styles.signupButton}
					onPress={handleSignup}
					disabled={loading}
				>
					{loading ? (
						<ActivityIndicator size="small" color="#1e1e1e" />
					) : (
						<Text style={styles.buttonLabel}>Sign Up</Text>
					)}
				</Pressable>

				<Pressable onPress={() => router.push("/login")}>
					<Text style={styles.loginText}>
						Already have an account? Login
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
	title: {
		fontSize: 32,
		fontWeight: "600",
		color: "#fff",
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
	signupButton: {
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
	loginText: {
		color: "#42FF4E",
		fontSize: 16,
	},
});
