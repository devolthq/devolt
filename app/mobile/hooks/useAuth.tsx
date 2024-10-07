import React, { useState, useEffect, createContext, useContext } from "react";
import {
	login as loginService,
	logout as logoutService,
	getToken,
	storeToken,
} from "@/services/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import teslaModelX from "@/assets/images/tesla-model-x.png";
import { router } from "expo-router";

export interface Vehicle {
	manufacturer: "BYD" | "Tesla";
	model: "Dolphin" | "Model X";
	year: 2019 | 2020 | 2021;
	type: "hybrid" | "electric";
	color: "black";
	image?: string;
	battery: {
		capacity: number; // in kWh
		current_charge: number; // in % 0 to 1
	};
}

export interface FinancialDetails {
	cnpj: string;
}

export interface User {
	id: string;
	name: string;
	email: string;
	public_key: string;
	vehicle: Vehicle;
	financialDetails: FinancialDetails;
}

interface AuthContextProps {
	user: User | null;
	token: string | null;
	isLoggedIn: boolean;
	isLoading: boolean;
	login: (email: string, password: string) => Promise<void>;
	logout: () => void;
	getUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}

const defaultVehicle: Vehicle = {
	manufacturer: "Tesla",
	color: "black",
	model: "Model X",
	year: 2021,
	type: "electric",
	image: teslaModelX.uri,
	battery: {
		capacity: 100,
		current_charge: 0.63,
	},
};
const defaultFinancialDetails: FinancialDetails = {
	cnpj: "12345678901234",
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isLoggedIn, setIsLoggedIn] = useState(false);

	useEffect(() => {
		const loadUserFromStorage = async () => {
			const storedToken = await getToken();
			if (storedToken) {
				setToken(storedToken);
				const storedUser = await AsyncStorage.getItem("user");
				if (storedUser) {
					const parsedUser = JSON.parse(storedUser);
					if (!parsedUser.vehicle) {
						parsedUser.vehicle = defaultVehicle;
					}
					setUser(parsedUser);
				}
				setIsLoggedIn(true);
			}
			setIsLoading(false);
		};
		loadUserFromStorage();
	}, []);

	const login = async (email: string, password: string) => {
		setIsLoading(true);
		try {
			const response = await loginService(email, password);
			console.log("Login response:", response);

			const { user, token } = response;

			const userData = {
				id: user.id,
				name: user.name,
				email: user.email,
				public_key: user.public_key,
				vehicle: defaultVehicle,
				financialDetails: defaultFinancialDetails,
			};

			if (!userData.vehicle) {
				userData.vehicle = defaultVehicle;
			}
			if (!userData.financialDetails) {
				userData.financialDetails = defaultFinancialDetails;
			}

			setToken(token);
			setIsLoggedIn(true);

			await storeToken(token);
			await AsyncStorage.setItem("user", JSON.stringify(userData));
			console.log("Token stored successfully:", token);
		} catch (error) {
			console.error("Login error:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const logout = async () => {
		await logoutService();
		setUser(null);
		setToken(null);
		setIsLoggedIn(false);
		await AsyncStorage.removeItem("user");
		router.replace("/onboard/onboard");
	};

	const getUser = async (): Promise<User | null> => {
		const storedUser = await AsyncStorage.getItem("user");
		if (storedUser) {
			const parsedUser = JSON.parse(storedUser);
			if (!parsedUser.vehicle) {
				parsedUser.vehicle = defaultVehicle;
			}
			return parsedUser;
		}
		return null;
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				token,
				isLoggedIn,
				isLoading,
				login,
				logout,
				getUser,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};
