import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function CreditCard({
	cardNumber,
	cardName,
	cardExpiry,
}: {
	cardNumber: string;
	cardName: string;
	cardExpiry: string;
}) {
	const abbreviateName = (name: string) => {
        console.log(name);
		const parts = name.split(" ");
		if (parts.length <= 2) {
			return name;
		}
		return `${parts[0]} ${parts
			.slice(1, -1)
			.map((n) => n[0] + ".")
			.join(" ")} ${parts[parts.length - 1]}`;
	};

	const [cardType, setCardType] = useState("");

	const getCardType = (cardNumber: string) => {
		const visa = /^4[0-9]{12}(?:[0-9]{3})?$/;
		const mastercard = /^5[1-5][0-9]{14}$/;

		switch (true) {
			case visa.test(cardNumber):
				setCardType("visa");
				break;
			case mastercard.test(cardNumber):
				setCardType("mastercard");
				break;
			default:
				setCardType("unknown");
				break;
		}
	};

	useEffect(() => {
		getCardType(cardNumber);
	}, [cardNumber]);

	return (
		<View style={styles.container}>
			<View style={styles.glassCard}>
				<View style={styles.cardType}>
					{cardType === "visa" && (
						<Text style={styles.cardTypeImage}>VISA</Text>
					)}
					{cardType === "mastercard" && (
						<Text style={styles.cardTypeImage}>Mastercard</Text>
					)}
				</View>

				<View>
					{cardNumber && (
						<Text style={styles.cardNumber}>
							**** **** **** {cardNumber.slice(-4)}
						</Text>
					)}
					<View style={styles.cardInfo}>
						<Text style={styles.cardName}>
							{abbreviateName(cardName)}
						</Text>
						<Text style={styles.cardExpiry}>{cardExpiry}</Text>
					</View>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 20,
	},
	glassCard: {
		width: "100%",
		height: 240,
		borderRadius: 15,
		backgroundColor: "rgba(255, 255, 255, 0.1)",
		overflow: "hidden",
		padding: 20,
		display: "flex",
		flexDirection: "column",
		justifyContent: "space-between",
		shadowColor: "#42FF4E",
		shadowOffset: { width: 0, height: 5 },
		shadowOpacity: 0.3,
		shadowRadius: 10,
	},
	cardType: {
		display: "flex",
		flexDirection: "column",
		justifyContent: "space-between",
		alignItems: "center",
		width: "100%",
		height: 40,
	},
	cardTypeImage: {
		color: "#fff",
		fontSize: 16,
		textTransform: "uppercase",
		backgroundColor: "rgba(0, 0, 0, 0.5)",
		padding: 5,
		borderRadius: 5,
	},
	cardNumber: {
		color: "#fff",
		fontSize: 20,
		letterSpacing: 2,
		marginBottom: 20,
	},
	cardInfo: {
		flexDirection: "row",
		justifyContent: "space-between",
		width: "100%",
	},
	cardName: {
		color: "#fff",
		fontSize: 16,
		textTransform: "uppercase",
	},
	cardExpiry: {
		color: "#fff",
		fontSize: 16,
	},
});
