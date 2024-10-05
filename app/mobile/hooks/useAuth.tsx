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
	const [isLoggedIn, setIsLoggedIn] = useState(false);

	useEffect(() => {
		const loadUserFromStorage = async () => {
			const storedToken = await getToken();
			if (storedToken) {
				setToken(storedToken);
				const storedUser = await AsyncStorage.getItem("user");
				if (storedUser) setUser(JSON.parse(storedUser));
				setIsLoggedIn(true);
			}
			setIsLoading(false);
		};
		loadUserFromStorage();
	}, []);

	const login = async (email: string, password: string) => {
		setIsLoading(true);
		try {
			const { user, token } = await loginService(email, password);
			setUser(user);
			setToken(token);
			setIsLoggedIn(true);

			await storeToken(token);
			await AsyncStorage.setItem("user", JSON.stringify(user));
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
		router.replace("/onboard");
	};

	return (
		<AuthContext.Provider
			value={{ user, token, isLoggedIn, isLoading, login, logout }}
		>
			{children}
		</AuthContext.Provider>
	);
};
