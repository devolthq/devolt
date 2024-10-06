import React, { useState } from "react";
import {
	View,
	Text,
	Image,
	TextInput,
	Pressable,
	StyleSheet,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import defaultImage from "@/assets/images/car.png";
import { Station } from "@/constants/Stations";
import { User } from "@/hooks/useAuth";

interface PurchaseContainerProps {
	user: User;
	selectedStation: Station;
	onPurchase: () => void;
}

export const BuyEnergyContainer: React.FC<PurchaseContainerProps> = ({
	user,
	selectedStation,
	onPurchase,
}) => {
	const [batteryAmount, setBatteryAmount] = useState("");
	const [timeFromStation] = useState(
		Math.round(Math.abs(Math.random() * 100))
	);

	return (
		<View style={styles.container}>
			<View style={styles.detailsContainer}>
				<Text style={styles.stationDetails}>
					Your vehicle: {user?.vehicle?.manufacturer}{" "}
					{user?.vehicle?.model}
				</Text>
				<Image
					resizeMode="contain"
					source={
						user?.vehicle?.image
							? { uri: user.vehicle.image }
							: defaultImage
					}
					style={styles.vehicleImage}
				/>
				{user?.vehicle?.battery?.current_charge && (
					<Text style={styles.stationDetails}>
						Current Charge:{" "}
						{Math.round(
							user?.vehicle?.battery.current_charge * 100
						)}
						%
					</Text>
				)}
				{user?.vehicle?.battery.current_charge && (
					<Text style={styles.stationDetails}>
						Ideal Charge:{" "}
						{Math.round(
							100 - user?.vehicle?.battery.current_charge * 100
						)}
						%
					</Text>
				)}

				<View style={styles.batteryInputContainer}>
					<Pressable
						style={styles.button}
						onPress={() => {
							const currentCharge =
								user?.vehicle?.battery?.current_charge || 0;
							const newCharge = Math.max(
								currentCharge,
								(parseFloat(batteryAmount) || 0) - 1
							);
							setBatteryAmount(newCharge.toString());
						}}
					>
						<Text style={styles.buttonText}>-</Text>
					</Pressable>

					<TextInput
						style={styles.textInput}
						placeholder="Battery Amount"
						placeholderTextColor="#aaa"
						value={batteryAmount}
						onChangeText={(text) => {
							const numericValue = parseFloat(text);
							const maxCharge =
								user?.vehicle?.battery?.capacity || 100;
							const currentCharge =
								user?.vehicle?.battery?.current_charge || 0;
							if (
								!isNaN(numericValue) &&
								numericValue >= currentCharge &&
								numericValue <= maxCharge
							) {
								setBatteryAmount(text);
							} else {
								setBatteryAmount("");
							}
						}}
						keyboardType="number-pad"
					/>

					<Pressable
						style={styles.button}
						onPress={() => {
							const maxCharge =
								user?.vehicle?.battery?.capacity || 100;
							const newCharge = Math.min(
								maxCharge,
								(parseFloat(batteryAmount) || 0) + 1
							);
							setBatteryAmount(newCharge.toString());
						}}
					>
						<Text style={styles.buttonText}>+</Text>
					</Pressable>
				</View>

				<Text style={styles.stationDetails}>
					{selectedStation.address}
				</Text>
				<Text style={styles.stationDetails}>
					Time from station: {timeFromStation} min
				</Text>
			</View>

			<Pressable style={styles.purchaseButton} onPress={onPurchase}>
				<Ionicons name="flash-outline" size={24} color="#1e1e1e" />
				<Text style={styles.purchaseButtonText}>Purchase Energy</Text>
			</Pressable>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {},
	detailsContainer: {
		flexDirection: "column",
		justifyContent: "space-between",
		alignItems: "center",
	},
	stationDetails: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "bold",
		marginBottom: 10,
	},
	vehicleImage: {
		width: "75%",
	},
	batteryInputContainer: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 20,
		gap: 10,
		marginVertical: 10,
	},
	button: {
		backgroundColor: "#101010",
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 10,
	},
	buttonText: {
		color: "#fff",
		fontSize: 24,
	},
	textInput: {
		backgroundColor: "#101010",
		color: "#fff",
		paddingHorizontal: 15,
		paddingVertical: 10,
		borderRadius: 10,
		width: 100,
		textAlign: "center",
	},
	purchaseButton: {
		backgroundColor: "#42FF4E",
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 10,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		marginTop: 10,
	},
	purchaseButtonText: {
		color: "#1e1e1e",
		fontSize: 20,
		fontWeight: "600",
		marginLeft: 10,
	},
});
