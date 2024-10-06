// SellEnergyContainer.tsx

import React, { useEffect, useState } from "react";
import {
	View,
	Text,
	TextInput,
	Pressable,
	StyleSheet,
	Switch,
	TouchableOpacity,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Station } from "@/constants/Stations";
import { CustomPicker } from "./CustomPicker";
import { useForm, Controller } from "react-hook-form";
import { useAuth, User } from "@/hooks/useAuth";
import { ExternalLink } from "@/components/ExternalLink";

interface CustomSwitchProps {
	value: boolean;
	onValueChange: (value: boolean) => void;
}

const CustomSwitch: React.FC<CustomSwitchProps> = ({
	value,
	onValueChange,
}) => {
	return (
		<Switch
			value={value}
			onValueChange={onValueChange}
			thumbColor="#e1e1e1"
			trackColor={{ false: "#767577", true: "#42ff4e" }}
		/>
	);
};

interface SellEnergyContainerProps {
	onSell: (data: SellData) => void;
}

export interface SellData {
	station?: Station;
	generationMethod: string;
	amount: string;
	sellerCNPJ: string;
	buyerCNPJ: string;
	contractFile: File | null;
	registeredInCCEE: boolean;
	authorizedByANEEL: boolean;
}

export const SellEnergyContainer: React.FC<SellEnergyContainerProps> = ({
	onSell,
}) => {
	const {
		control,
		handleSubmit,
		setValue,
		formState: { errors },
	} = useForm<SellData>({
		defaultValues: {
			generationMethod: "Solar",
			amount: "1000",
			sellerCNPJ: "12.345.678/0001-95",
			buyerCNPJ: "98.765.432/0001-12",
			contractFile: null,
			registeredInCCEE: true,
			authorizedByANEEL: true,
		},
	});

	const { user } = useAuth();

	useEffect(() => {
		if (user?.financialDetails?.cnpj) {
			setValue("sellerCNPJ", user.financialDetails.cnpj);
		}
	}, [user]);

	const onSubmit = (data: SellData) => {
		onSell(data);
	};

	const handleFilePick = async () => {};

	return (
		<View style={styles.container}>
			<ExternalLink
				href="https://www.devolt.xyz/#about"
				style={{
					marginBottom: 20,
					gap: 5,
					textDecorationLine: "underline",
				}}
			>
				<Text
					style={{
						color: "#42FF4E",
						fontSize: 14,
						marginBottom: 10,
					}}
				>
					Know more about the Open Energy Market
				</Text>

				<Ionicons
					name="help-circle-outline"
					size={12}
					color="#42FF4E"
				/>
			</ExternalLink>

			<View style={styles.inputContainer}>
				<View style={styles.labelContainer}>
					<Text style={styles.label}>
						Your CNPJ <Text style={{ color: "red" }}>*</Text>
					</Text>
				</View>
				<Text style={styles.description}>
					Enter the CNPJ (Company Registration Number) of your
					company.
				</Text>
				<Controller
					control={control}
					disabled={!user?.financialDetails?.cnpj}
					defaultValue={user?.financialDetails?.cnpj}
					name="sellerCNPJ"
					rules={{
						required: "CNPJ is required",
						validate: (value) =>
							// isValidCNPJ(value) || "Invalid CNPJ",
							true,
					}}
					render={({ field: { onChange, value } }) => (
						<TextInput
							style={styles.input}
							placeholder="Enter your CNPJ"
							placeholderTextColor="#aaa"
							value={formatCNPJ(value)}
							onChangeText={(text) => onChange(formatCNPJ(text))}
							keyboardType="numeric"
						/>
					)}
				/>
				{errors.sellerCNPJ && (
					<Text style={styles.errorText}>
						{errors.sellerCNPJ.message}
					</Text>
				)}
			</View>

			{/* Generation Method */}
			<View style={styles.inputContainer}>
				<View style={styles.labelContainer}>
					<Text style={styles.label}>
						Generation Method{" "}
						<Text style={{ color: "red" }}>*</Text>
					</Text>
				</View>
				<Text style={styles.description}>
					Select the method by which the energy was generated.
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

			{/* Amount */}
			<View style={styles.inputContainer}>
				<View style={styles.labelContainer}>
					<Text style={styles.label}>
						Amount (kWh) <Text style={{ color: "red" }}>*</Text>
					</Text>
				</View>
				<Text style={styles.description}>
					Enter the amount of energy to sell in kilowatt-hours (kWh).
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
						<TextInput
							style={styles.input}
							placeholder="Enter amount in kWh"
							placeholderTextColor="#aaa"
							value={value}
							onChangeText={onChange}
							keyboardType="numeric"
						/>
					)}
				/>
				{errors.amount && (
					<Text style={styles.errorText}>
						{errors.amount.message}
					</Text>
				)}
			</View>

			{/* Contract File */}
			<View style={styles.inputContainer}>
				<View style={styles.labelContainer}>
					<Text style={styles.label}>Contract File</Text>
				</View>
				<Text style={styles.description}>
					Upload the contract details as a PDF file.
				</Text>
				<Controller
					control={control}
					name="contractFile"
					render={({ field: { value } }) => (
						<View>
							<TouchableOpacity
								style={styles.fileButton}
								onPress={handleFilePick}
							>
								<Text style={styles.fileButtonText}>
									{value ? value.name : "Select PDF File"}
								</Text>
							</TouchableOpacity>
						</View>
					)}
				/>
				{errors.contractFile && (
					<Text style={styles.errorText}>
						{errors.contractFile.message}
					</Text>
				)}
			</View>

			{/* Registered with CCEE */}
			<View style={styles.inputContainer}>
				<View style={styles.labelContainer}>
					<Text style={styles.label}>Registered with CCEE?</Text>
				</View>
				<Text style={styles.description}>
					Indicate whether your company is registered with the CCEE
					(Electric Energy Trading Chamber).
				</Text>
				<Controller
					control={control}
					name="registeredInCCEE"
					render={({ field: { onChange, value } }) => (
						<CustomSwitch value={value} onValueChange={onChange} />
					)}
				/>
			</View>

			{/* Authorized by ANEEL */}
			<View style={styles.inputContainer}>
				<View style={styles.labelContainer}>
					<Text style={styles.label}>Authorized by ANEEL?</Text>
				</View>
				<Text style={styles.description}>
					Indicate whether your company is authorized by ANEEL
					(National Electric Energy Agency).
				</Text>
				<Controller
					control={control}
					name="authorizedByANEEL"
					render={({ field: { onChange, value } }) => (
						<CustomSwitch value={value} onValueChange={onChange} />
					)}
				/>
			</View>

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
	container: {},
	labelContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	title: {
		color: "#fff",
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 20,
	},
	label: {
		color: "#fff",
		fontSize: 16,
		marginBottom: 5,
	},
	description: {
		color: "#aaa",
		fontSize: 14,
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
	inputContainer: {
		marginBottom: 10,
	},
	fileButton: {
		backgroundColor: "#42FF4E",
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 10,
		alignItems: "center",
	},
	fileButtonText: {
		color: "#1e1e1e",
		fontSize: 16,
		fontWeight: "600",
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

const formatCNPJ = (value: string) => {
	if (!value) return "";

	return value
		.replace(/\D/g, "")
		.replace(/^(\d{2})(\d)/, "$1.$2")
		.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
		.replace(/\.(\d{3})(\d)/, ".$1/$2")
		.replace(/(\d{4})(\d)/, "$1-$2")
		.replace(/(-\d{2})\d+?$/, "$1");
};

function isValidCNPJ(cnpj: string): boolean {
	cnpj = cnpj.replace(/[^\d]+/g, "");

	// if (cnpj.length !== 14) return false;
	// if (/^(\d)\1+$/.test(cnpj)) return false;

	let size = cnpj.length - 2;
	let numbers = cnpj.substring(0, size);
	let digits = cnpj.substring(size);
	let sum = 0;
	let pos = size - 7;

	for (let i = size; i >= 1; i--) {
		sum += parseInt(numbers.charAt(size - i)) * pos--;
		if (pos < 2) pos = 9;
	}

	let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
	// if (result !== parseInt(digits.charAt(0))) return false;

	size += 1;
	numbers = cnpj.substring(0, size);
	sum = 0;
	pos = size - 7;

	for (let i = size; i >= 1; i--) {
		sum += parseInt(numbers.charAt(size - i)) * pos--;
		if (pos < 2) pos = 9;
	}

	result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
	if (result !== parseInt(digits.charAt(1))) return false;

	return true;
}
