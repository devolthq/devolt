import React, { useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

interface ToggleButtonProps {
	mode: number;
	setMode: React.Dispatch<React.SetStateAction<number>>;
}

export const ToggleButton: React.FC<ToggleButtonProps> = ({
	mode,
	setMode,
}) => {
	const [isPressed, setIsPressed] = useState(false);

	const toggleMode = () => {
		const newMode = mode === 0 ? 1 : 0;
		setMode(newMode);
		console.log("Clicked", newMode);
	};

	return (
		<Pressable
			style={styles.toggleButton}
			onPressIn={() => setIsPressed(true)}
			onPressOut={() => setIsPressed(false)}
			onPress={toggleMode}
		>
			<Ionicons
				name={mode === 0 ? "swap-horizontal" : "swap-horizontal"}
				size={22}
				color={isPressed ? "#fff" : "#aaa"}
			/>
		</Pressable>
	);
};

const styles = StyleSheet.create({
	toggleButton: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#101010",
		padding: 10,
		borderRadius: 10,
		justifyContent: "center",
	},
	toggleButtonText: {
		fontSize: 16,
		fontWeight: "bold",
		marginLeft: 10,
	},
});
