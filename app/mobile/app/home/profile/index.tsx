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
import { USDC_MINT } from "@/constants/Solana";
import { Connection, PublicKey } from "@solana/web3.js";
import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";

export default function Profile() {
	const { user }: { user: User } = useAuth();
	const [usdcBalance, setUsdcBalance] = useState<string | null>(null);

	useEffect(() => {
		const fetchUsdcBalance = async () => {
			try {
				const connection = new Connection("http://localhost:8899");
				const publicKey = new PublicKey(user.public_key);
				const usdcMint = new PublicKey(USDC_MINT);
				const associatedTokenAddress = await getAssociatedTokenAddress(
					usdcMint,
					publicKey
				);
				const accountInfo = await getAccount(
					connection,
					associatedTokenAddress
				);
				const balance = Number(accountInfo.amount) / Math.pow(10, 6); // USDC has 6 decimal places
				const formattedBalance = balance.toLocaleString(undefined, {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2,
				});
				setUsdcBalance(formattedBalance);
			} catch (error) {
				console.error("Failed to fetch USDC balance:", error);
			}
		};

		if (user) {
			fetchUsdcBalance();
		}
	}, [user]);

	return (
		<ScrollView style={styles.container}>
			<StatusBar barStyle="light-content" />

			<View style={styles.contentContainer}>
				<Text style={styles.title}>Profile</Text>
				<View style={styles.contentContainer}>
					<Text style={styles.contentTitle}>Name</Text>
					<Text style={styles.contentText}>{user.name}</Text>

					<Text style={styles.contentTitle}>Email</Text>
					<Text style={styles.contentText}>{user.email}</Text>
				</View>
			</View>

			<View style={styles.contentContainer}>
				<Text style={styles.title}>Financial information</Text>

				<Text style={styles.contentTitle}>Credit Card</Text>
				<CreditCard
					cardName={user.name}
					cardNumber={"3865458954123654"}
					cardExpiry={"12/25"}
				/>

				<Text style={styles.contentTitle}>Public Key</Text>
				<ExternalLink
					style={{ ...styles.contentText, gap: 5 }}
					href={`https://solscan.io/account/${user.public_key}?cluster=custom&customUrl=http://localhost:8899`}
				>
					{user.public_key} <Ionicons name="open-outline" size={18} />
				</ExternalLink>

				{usdcBalance !== null && (
					<View style={styles.contentContainer}>
						<Text style={styles.contentTitle}>USDC Balance</Text>
						<Text style={styles.contentText}>
							$ {usdcBalance} USDC
						</Text>
					</View>
				)}
			</View>

			{user.vehicle && (
				<View style={styles.contentContainer}>
					<Text style={styles.title}>Vehicle Information</Text>

					<Text style={styles.contentTitle}>Manufacturer</Text>
					<Text style={styles.contentText}>
						{user.vehicle.manufacturer}
					</Text>

					<Text style={styles.contentTitle}>Model</Text>
					<Text style={styles.contentText}>{user.vehicle.model}</Text>

					<Text style={styles.contentTitle}>Year</Text>
					<Text style={styles.contentText}>{user.vehicle.year}</Text>

					{user.vehicle.image && (
						<Image
							source={{ uri: user.vehicle.image }}
							style={styles.image}
						/>
					)}

					<Text style={styles.contentTitle}>Type</Text>
					<Text style={styles.contentText}>{user.vehicle.type}</Text>

					<Text style={styles.contentTitle}>Color</Text>
					<Text style={styles.contentText}>{user.vehicle.color}</Text>

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
		display: "flex",
		flexDirection: "column",
		backgroundColor: "#101010",
		paddingHorizontal: 20,
		paddingTop: 120,
	},
	title: {
		color: "#fff",
		fontSize: 24,
		marginBottom: 20,
		fontWeight: "400",
	},
	contentContainer: {
		marginBottom: 10,
	},
	text: {
		color: "#fff",
		fontSize: 16,
		marginBottom: 10,
	},
	image: {
		width: 200,
		height: 100,
		marginTop: 10,
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
});
