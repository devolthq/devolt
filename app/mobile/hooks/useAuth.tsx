import React, { useState, useEffect, createContext, useContext } from "react";
import {
	login as loginService,
	logout as logoutService,
	getToken,
	storeToken,
} from "@/services/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

interface User {
	id: string;
	name: string;
	email: string;
	public_key: string;
}

interface AuthContextProps {
	user: User | null;
	token: string | null;
	isLoggedIn: boolean;
	isLoading: boolean;
	login: (email: string, password: string) => Promise<void>;
	logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const loadUserFromStorage = async () => {
			const storedToken = await getToken();
			if (storedToken) {
				setToken(storedToken);
				const storedUser = await AsyncStorage.getItem("user");
				console.log("Stored user:", storedUser);
				if (storedUser) setUser(JSON.parse(storedUser));
			}
			setIsLoading(false);
		};
		loadUserFromStorage();
	}, []);

	const login = async (email: string, password: string) => {
		const { user, token } = await loginService(email, password);
		setUser(user);
		setToken(token);

		await storeToken(token);
		await AsyncStorage.setItem("user", JSON.stringify(user));
	};

	const logout = async () => {
		await logoutService();
		setUser(null);
		setToken(null);
		await AsyncStorage.removeItem("user");
		router.replace("/login");
	};

	const isLoggedIn = !!token;

	return (
		<AuthContext.Provider
			value={{ user, token, isLoggedIn, isLoading, login, logout }}
		>
			{children}
		</AuthContext.Provider>
	);
};
