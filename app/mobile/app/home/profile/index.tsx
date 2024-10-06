import React, { useEffect, useState } from "react";
import { useAuth, User } from "@/hooks/useAuth";
import {
	View,
	Text,
	StyleSheet,
	StatusBar,
	ScrollView,
	Image,
} from "react-native";
import CreditCard from "@/components/CreditCard";
import { ExternalLink } from "@/components/ExternalLink";
import { Ionicons } from "@expo/vector-icons";
import { RPC_URL, USDC_MINT } from "@/constants/Solana";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
	getAccount,
	getAssociatedTokenAddress,
	getOrCreateAssociatedTokenAccount,
	TokenAccountNotFoundError,
} from "@solana/spl-token";

const keypair = Keypair.fromSecretKey(
	new Uint8Array([
		94, 81, 92, 183, 2, 61, 203, 40, 162, 234, 112, 4, 209, 215, 124, 100,
		144, 123, 232, 25, 70, 73, 154, 130, 124, 210, 10, 175, 62, 230, 27,
		175, 8, 157, 187, 229, 126, 241, 43, 126, 216, 162, 105, 235, 250, 183,
		161, 236, 244, 144, 89, 116, 3, 247, 67, 200, 82, 93, 63, 104, 70, 143,
		124, 76,
	])
);

export default function Profile() {
	const { user }: { user: User | null } = useAuth();
	const [usdcBalance, setUsdcBalance] = useState<string | null>(null);

	const connection = new Connection(RPC_URL);
	connection.getEpochInfo().then((info) => {
		console.log("Epoch info:", info);
	});

	useEffect(() => {
		const fetchUsdcBalance = async () => {
			if (!user) return;

			try {
				const publicKey = new PublicKey(user.public_key);
				const usdcMint = new PublicKey(USDC_MINT);

				try {
					const tokenAccount =
						await getOrCreateAssociatedTokenAccount(
							connection,
							keypair,
							publicKey,
							usdcMint
						).then((account) => account.address);

					const balance = await connection.getTokenAccountBalance(
						tokenAccount
					);
					console.log(
						"Balance:",
						balance.value.uiAmount / balance.value.decimals
					);

					setUsdcBalance(
						(
							balance.value.uiAmount / balance.value.decimals
						).toFixed(2)
					);
				} catch (error) {
					if (error instanceof TokenAccountNotFoundError) {
						console.log("USDC account not found:", error);
						setUsdcBalance("0.00");
					} else {
						console.error("Failed to fetch USDC balance:", error);
						throw error;
					}
				}
			} catch (error) {
				console.error("Failed to fetch USDC balance:", error);
			}
		};

		fetchUsdcBalance();
	}, [user]);

	const capitalizeWords = (str: string) => {
		return str.replace(/\b\w/g, (char) => char.toUpperCase());
	};

	if (!user) {
		return (
			<View style={styles.container}>
				<Text style={styles.errorText}>User not found</Text>
			</View>
		);
	}

	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={styles.contentContainer}
		>
			<StatusBar barStyle="light-content" />

			<View style={styles.sectionContainer}>
				<Text style={styles.title}>Profile</Text>
				<View style={styles.sectionContent}>
					<Text style={styles.contentTitle}>Name</Text>
					<Text style={styles.contentText}>{user.name}</Text>

					<Text style={styles.contentTitle}>Email</Text>
					<Text style={styles.contentText}>{user.email}</Text>
				</View>
			</View>

			<View style={styles.sectionContainer}>
				<Text style={styles.title}>Financial information</Text>

				<Text style={styles.contentTitle}>Credit Card</Text>
				<View style={styles.sectionContent}>
					<CreditCard
						cardName={user.name}
						cardNumber={"3865458954123654"}
						cardExpiry={"12/25"}
					/>
				</View>

				<Text style={styles.contentTitle}>Public Key</Text>
				<ExternalLink
					style={{ ...styles.contentText, gap: 5 }}
					href={`https://solscan.io/account/${user.public_key}?cluster=custom&customUrl=https://9959-2a01-4f9-1a-b149-00-2.ngrok-free.app`}
				>
					{user.public_key} <Ionicons name="open-outline" size={18} />
				</ExternalLink>

				{usdcBalance !== null && usdcBalance != "0.00" && (
					<View style={styles.sectionContent}>
						<Text style={styles.contentTitle}>Balance</Text>
						<Text style={styles.contentText}>
							$ {usdcBalance} USD
						</Text>
					</View>
				)}
			</View>

			{user.vehicle && (
				<View style={styles.sectionContainer}>
					<Text style={styles.title}>Vehicle Information</Text>

					<Text style={styles.contentTitle}>Manufacturer</Text>
					<Text style={styles.contentText}>
						{capitalizeWords(user.vehicle.manufacturer)}
					</Text>

					<Text style={styles.contentTitle}>Model</Text>
					<Text style={styles.contentText}>
						{capitalizeWords(user.vehicle.model)}
					</Text>

					<Text style={styles.contentTitle}>Year</Text>
					<Text style={styles.contentText}>{user.vehicle.year}</Text>

					{user.vehicle.image && (
						<Image
							source={{ uri: user.vehicle.image }}
							style={styles.image}
						/>
					)}

					<Text style={styles.contentTitle}>Type</Text>
					<Text style={styles.contentText}>
						{capitalizeWords(user.vehicle.type)}
					</Text>

					<Text style={styles.contentTitle}>Color</Text>
					<Text style={styles.contentText}>
						{capitalizeWords(user.vehicle.color)}
					</Text>

					<Text style={styles.contentTitle}>Battery Capacity</Text>
					<Text style={styles.contentText}>
						{user.vehicle.battery.capacity} kWh
					</Text>

					<Text style={styles.contentTitle}>Current Charge</Text>
					<Text style={styles.contentText}>
						{user.vehicle.battery.current_charge * 100}%
					</Text>
				</View>
			)}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#101010",
	},
	contentContainer: {
		paddingHorizontal: 20,
		paddingTop: 120,
		paddingBottom: 20,
		justifyContent: "center",
		alignItems: "center",
	},
	sectionContainer: {
		marginBottom: 20,
		width: "100%",
	},
	title: {
		color: "#fff",
		fontSize: 24,
		marginBottom: 20,
		fontWeight: "400",
	},
	sectionContent: {
		marginBottom: 10,
	},
	contentTitle: {
		color: "#a1a1a1",
		fontSize: 16,
	},
	contentText: {
		color: "#fff",
		fontSize: 20,
		marginBottom: 10,
	},
	image: {
		width: 200,
		height: 100,
		marginTop: 10,
	},
	errorText: {
		color: "#fff",
		fontSize: 18,
	},
});
