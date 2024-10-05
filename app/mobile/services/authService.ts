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
	} catch (error) {
		console.error("Failed to save the token");
	}
}

export async function getToken(): Promise<string | null> {
	try {
		return await AsyncStorage.getItem("token");
	} catch (error) {
		console.error("Failed to get the token");
		return null;
	}
}

export async function logout(): Promise<void> {
	try {
		await AsyncStorage.removeItem("token");
	} catch (error) {
		console.error("Failed to logout");
	}
}
