import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function CreditCard({ cardEnding, cardName, cardExpiry }) {
	return (
		<View style={styles.container}>
			<View style={styles.glassCard}>
				<Text style={styles.cardNumber}>
					**** **** **** {cardEnding}
				</Text>
				<View style={styles.cardInfo}>
					<Text style={styles.cardName}>{cardName}</Text>
					<Text style={styles.cardExpiry}>{cardExpiry}</Text>
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
	},
	glassCard: {
		width: "100%",
		height: 240,
		borderRadius: 20,
		backgroundColor: "rgba(255, 255, 255, 0.1)",
		overflow: "hidden",
		padding: 20,
		justifyContent: "flex-end",
		shadowColor: "#e1e1e1",
		shadowOffset: { width: 0, height: 5 },
		shadowOpacity: 0.3,
		shadowRadius: 10,
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
	}
});
