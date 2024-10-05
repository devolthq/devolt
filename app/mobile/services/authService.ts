import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://localhost:5500";

export interface User {
	id: string;
	name: string;
	email: string;
	public_key: string;
}

export interface SignupResponse {
	id: string;
	name: string;
	email: string;
	public_key: string;
}

export interface LoginResponse {
	user: User;
	token: string;
}

export async function signUp(
	name: string,
	email: string,
	password: string
): Promise<SignupResponse> {
	const response = await fetch(`${API_URL}/user/sign_up`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ name, email, password }),
	});

	if (!response.ok) {
		throw new Error("Failed to sign up");
	}

	return await response.json();
}

export async function login(
	email: string,
	password: string
): Promise<LoginResponse> {
	const response = await fetch(`${API_URL}/user/login`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ email, password }),
	});

	if (!response.ok) {
		throw new Error("Failed to login");
	}

	const data: LoginResponse = await response.json();
	await storeToken(data.token);
	return data;
}

export async function storeToken(token: string): Promise<void> {
	try {
		await AsyncStorage.setItem("token", token);
		console.log("Token stored successfully:", token);
	} catch (error) {
		console.error("Failed to save the token:", error);
	}
}

export async function storeUser(user: User): Promise<void> {
	try {
		await AsyncStorage.setItem("user", JSON.stringify(user));
		console.log("User stored successfully:", user);
	} catch (error) {
		console.error("Failed to save the user:", error);
	}
}

export async function getToken(): Promise<string | null> {
	try {
		const token = await AsyncStorage.getItem("token");
		console.log("Token retrieved successfully:", token);
		return token;
	} catch (error) {
		console.error("Failed to get the token:", error);
		return null;
	}
}

export async function getUser(): Promise<User | null> {
	try {
		const user = await AsyncStorage.getItem("user");
		console.log("User retrieved successfully:", user);
		return user ? JSON.parse(user) : null;
	} catch (error) {
		console.error("Failed to get the user:", error);
		return null;
	}
}

export async function logout(): Promise<void> {
	try {
		await AsyncStorage.removeItem("token");
		console.log("Token removed successfully");
	} catch (error) {
		console.error("Failed to logout:", error);
	}
}
