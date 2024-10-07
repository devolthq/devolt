import React, { useState } from "react";
import {
	View,
	Text,
	Image,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	ActivityIndicator,
	Alert,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
// import QRCode from "react-native-qrcode-svg";
import defaultImage from "@/assets/images/car.png";
import { Station } from "@/constants/Stations";
import { User } from "@/hooks/useAuth";
import { buyEnergy } from "@/services/paymentEngineService";
import { ExternalLink } from "@/components/ExternalLink";

interface PurchaseContainerProps {
	user: User;
	selectedStation: Station;
	onPurchase: (batteryAmount: string) => void;
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
	const [loading, setLoading] = useState(false);
	const [transactionUrl, setTransactionUrl] = useState<string | null>(null);

	const handlePurchase = async () => {};

	if (loading) {
		return (
			<View style={{ ...styles.loadingContainer, paddingVertical: 20 }}>
				<ActivityIndicator size="large" color="#42FF4E" />
				<Text style={{ color: "#fff", fontSize: 18 }}>
					Processing payment... Hang tight!
				</Text>
			</View>
		);
	}

	if (transactionUrl) {
		return (
			<View style={styles.successContainer}>
				<ExternalLink href={transactionUrl}>
					<Text style={styles.successText}>
						View Transaction on Solscan
					</Text>
				</ExternalLink>
				{/* <QRCode value={transactionUrl} size={200} /> */}
			</View>
		);
	}

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
					<TouchableOpacity
						style={styles.button}
						onPress={() => {
							const currentCharge =
								user?.vehicle?.battery?.current_charge || 0;
							const newCharge = Math.max(
								currentCharge,
								Math.floor(
									(parseFloat(batteryAmount) || 0) / 10
								) *
									10 -
									10
							);
							setBatteryAmount(newCharge.toString());
						}}
						activeOpacity={0.7}
					>
						<Text style={{ ...styles.buttonText, fontSize: 30 }}>
							-
						</Text>
					</TouchableOpacity>

					<View
						style={{
							flexDirection: "column",
							alignContent: "center",
							justifyContent: "center",
						}}
					>
						<TextInput
							style={{
								...styles.textInput,
								fontSize: 20,
								width: "auto",
							}}
							placeholder="Battery Amount (kWh)"
							placeholderTextColor="#aaa"
							value={`${batteryAmount} kWh`}
							onChangeText={(text) => {
								const numericValue = parseFloat(text);
								const maxCharge =
									user?.vehicle?.battery?.capacity || 100;
								const currentCharge =
									user?.vehicle?.battery?.current_charge || 0;
								if (
									!isNaN(numericValue) &&
									numericValue >= currentCharge &&
									numericValue <= maxCharge &&
									numericValue % 10 === 0
								) {
									setBatteryAmount(numericValue.toString());
								} else {
									setBatteryAmount("");
								}
							}}
							keyboardType="number-pad"
						/>

						<View
							style={{
								flexDirection: "row",
								gap: 10,
								marginVertical: 5,
							}}
						>
							<Text style={{ color: "#fff" }}>
								Min: {user?.vehicle?.battery?.current_charge}{" "}
								kWh
							</Text>
							<Text style={{ color: "#fff" }}>
								Max: {user?.vehicle?.battery?.capacity} kWh
							</Text>
						</View>
						<Text style={{ color: "#fff", textAlign: "center" }}>
							Estimated Cost: ${" "}
							{batteryAmount
								? Math.ceil(parseInt(batteryAmount))
								: "0.00"}
						</Text>
					</View>

					<TouchableOpacity
						style={styles.button}
						onPress={() => {
							const maxCharge =
								user?.vehicle?.battery?.capacity || 100;
							const newCharge = Math.min(
								maxCharge,
								Math.ceil(
									(parseFloat(batteryAmount) || 0) / 10
								) *
									10 +
									10
							);
							setBatteryAmount(newCharge.toString());
						}}
						activeOpacity={0.7}
					>
						<Text style={{ ...styles.buttonText, fontSize: 30 }}>
							+
						</Text>
					</TouchableOpacity>
				</View>

				<Text style={styles.stationDetails}>
					{selectedStation.address}
				</Text>
				<Text style={styles.stationDetails}>
					Time from station: {timeFromStation} min
				</Text>
			</View>

			<TouchableOpacity
				style={styles.purchaseButton}
				onPress={() => {
					if (!batteryAmount) {
						Alert.alert(
							"Invalid Battery Amount",
							"Please enter a valid battery amount to purchase energy."
						);
						return;
					}

					Alert.alert(
						"Confirm Purchase",
						`Are you sure you want to purchase ${batteryAmount} kWh for $${Math.ceil(
							parseInt(batteryAmount)
						)}?`,
						[
							{
								text: "Cancel",
								style: "cancel",
							},
							{
								text: "Confirm",
								onPress: () => onPurchase(batteryAmount),
							},
						]
					);
				}}
				activeOpacity={0.7}
			>
				<Ionicons name="flash-outline" size={24} color="#1e1e1e" />
				<Text style={styles.purchaseButtonText}>Purchase Energy</Text>
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 20,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#101010",
	},
	successContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#101010",
		padding: 20,
	},
	successText: {
		color: "#42FF4E",
		fontSize: 18,
		marginBottom: 20,
	},
	title: {
		color: "#fff",
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 20,
	},
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
		gap: 30,
		marginVertical: 20,
	},
	button: {
		backgroundColor: "#1e1e1e",
		width: 40,
		height: 40,
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 20,
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
		borderWidth: 1,
		borderColor: "#aaa",
		alignSelf: "center",
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
