import axios from "axios";
import { Alert } from "react-native";
import { getToken } from "@/services/authService";
import { API_URL } from "@/constants/API";

export type TransactionResponse = {
	signature: string;
	escrowPublicKey: string;
};

const axiosInstance = axios.create({
	timeout: 30000000,
});

export const sellEnergy = async (
	usdcAmount: number
): Promise<TransactionResponse> => {
	try {
		const token = await getToken();
		let response = await axiosInstance.post(
			`${API_URL}/payment_engine/sell_energy`,
			{
				usdc_amount: usdcAmount,
			},
			{
				headers: {
					Authorization: `Bearer ${token}`,
				},
			}
		);
		let responseData = response.data as TransactionResponse;

		return responseData;
	} catch (error) {
		if (error.response && error.response.status === 401) {
			Alert.alert("Session expired", "Please log in again.");
		} else {
			console.error("Error selling energy:", error);
			throw error;
		}
	}
};

export const buyEnergy = async (
	energyAmount: number
): Promise<TransactionResponse> => {
	try {
		const token = await getToken();
		const response = await axiosInstance.post(
			`${API_URL}/payment_engine/buy_energy`,
			{
				energy_amount: energyAmount,
			},
			{
				headers: {
					Authorization: `Bearer ${token}`,
				},
			}
		);
		return response.data as TransactionResponse;
	} catch (error) {
		if (error.response && error.response.status === 401) {
			Alert.alert("Session expired", "Please log in again.");
		} else {
			console.error("Error buying energy:", error);
			throw error;
		}
	}
};
