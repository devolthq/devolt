import React from "react";
import {
	View,
	Text,
	TextInput,
	Pressable,
	StyleSheet,
	Alert,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Station, stations } from "@/constants/Stations";
import { User } from "@/hooks/useAuth";
import { CustomPicker } from "./CustomPicker";
import { useForm, Controller } from "react-hook-form";

interface SellEnergyContainerProps {
	user: User;
	onSell: (data: SellData) => void;
}

interface SellData {
	station?: Station;
	generationMethod: string;
	amount: string;
}

export const SellEnergyContainer: React.FC<SellEnergyContainerProps> = ({
	user,
	onSell,
}) => {
	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<SellData>();

	const onSubmit = (data: SellData) => {
		onSell(data);
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Sell Your Energy</Text>

			<View style={{ marginBottom: 10 }}>
				<Text style={styles.label}>
					Generation Method <Text style={{ color: "red" }}>*</Text>
				</Text>
				<Controller
					control={control}
					name="generationMethod"
					rules={{ required: "Generation method is required" }}
					render={({ field: { onChange, value } }) => (
						<CustomPicker
							items={[
								{ label: "Solar", value: "Solar" },
								{ label: "Wind", value: "Wind" },
								{ label: "Hydro", value: "Hydro" },
								{ label: "Other", value: "Other" },
							]}
							selectedValue={value}
							onValueChange={onChange}
							placeholder="Select generation method"
						/>
					)}
				/>
				{errors.generationMethod && (
					<Text style={styles.errorText}>
						{errors.generationMethod.message}
					</Text>
				)}
			</View>

			<View style={{ marginBottom: 10 }}>
				<Text style={styles.label}>
					Amount (kWh) <Text style={{ color: "red" }}>*</Text>
				</Text>
				<Controller
					control={control}
					name="amount"
					rules={{
						required: "Amount is required",
						pattern: {
							value: /^[0-9]*\.?[0-9]+$/,
							message: "Enter a valid number",
						},
					}}
					render={({ field: { onChange, value } }) => (
						<View>
							<TextInput
								style={styles.input}
								placeholder="Enter amount in kWh"
								placeholderTextColor="#aaa"
								value={value}
								onChangeText={onChange}
								keyboardType="numeric"
							/>
						</View>
					)}
				/>
				{errors.amount && (
					<Text style={styles.errorText}>
						{errors.amount.message}
					</Text>
				)}
			</View>

			{/* Station Selection (Optional) */}
			<Text style={styles.label}>Select a Station (Optional)</Text>
			<Controller
				control={control}
				name="station"
				render={({ field: { onChange, value } }) => (
					<CustomPicker
						items={[
							{ label: "None", value: undefined },
							...stations.map((station) => ({
								label: station.address,
								value: station.id,
							})),
						]}
						selectedValue={value?.id}
						onValueChange={(stationId) => {
							const station = stations.find(
								(s) => s.id === stationId
							);
							onChange(station);
						}}
						placeholder="Select a station"
					/>
				)}
			/>

			{/* Sell Button */}
			<Pressable
				style={styles.sellButton}
				onPress={handleSubmit(onSubmit)}
			>
				<Ionicons name="flash-outline" size={24} color="#1e1e1e" />
				<Text style={styles.sellButtonText}>Sell Energy</Text>
			</Pressable>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 10,
		paddingTop: 20,
	},
	title: {
		color: "#fff",
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 20,
		textAlign: "center",
	},
	label: {
		color: "#fff",
		fontSize: 16,
		marginBottom: 5,
	},
	input: {
		backgroundColor: "#1e1e1e",
		color: "#fff",
		paddingHorizontal: 10,
		paddingVertical: 10,
		borderRadius: 10,
		height: 40,
	},
	sellButton: {
		backgroundColor: "#42FF4E",
		paddingVertical: 15,
		borderRadius: 10,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		marginTop: 15,
	},
	sellButtonText: {
		color: "#1e1e1e",
		fontSize: 20,
		fontWeight: "600",
		marginLeft: 10,
	},
	errorText: {
		color: "red",
	},
});
