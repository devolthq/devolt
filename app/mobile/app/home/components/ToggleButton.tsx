import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import Ionicons from "@expo/vector-icons/Ionicons";

interface ToggleButtonProps {
	mode: number;
	setMode: React.Dispatch<React.SetStateAction<number>>;
}

export const ToggleButton: React.FC<ToggleButtonProps> = ({
	mode,
	setMode,
}) => {
	const toggleMode = () => {
		const newMode = mode === 0 ? 1 : 0;
		setMode(newMode);
		console.log("Clicked", newMode);
	};

	return (
		<Pressable style={styles.toggleButton} onPress={toggleMode}>
			<Ionicons
				name={mode === 0 ? "swap-horizontal" : "swap-horizontal"}
				size={24}
				color="#42FF4E"
			/>
			<Text style={styles.toggleButtonText}>
				Switch to {mode === 0 ? "Supplying Mode" : "Charging Mode"}
			</Text>
		</Pressable>
	);
};

const styles = StyleSheet.create({
	toggleButton: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#101010",
		borderWidth: 1,
		borderColor: "#42FF4E",
		padding: 10,
		borderRadius: 10,
		justifyContent: "center",
		marginVertical: 20,
	},
	toggleButtonText: {
		color: "#42FF4E",
		fontSize: 16,
		fontWeight: "bold",
		marginLeft: 10,
	},
});
