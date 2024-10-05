import { useNavigation } from "expo-router";
import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";

export default function Home() {
	const router = useNavigation();
	const isLogged = false;

	useEffect(() => {
		if (!isLogged) {
			router.navigate("onboard");
		}
	}, [router]);

	return (
		<View style={styles.container}>
			<Text style={styles.text}>Index Screen</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#fff",
	},
	text: {
		fontSize: 24,
		fontWeight: "600",
		color: "#000",
	},
});
