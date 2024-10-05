import { useAuth } from "@/hooks/useAuth";
import { View, StyleSheet, StatusBar, ScrollView, Text } from "react-native";
import CreditCard from "@/components/CreditCard";

export default function Statin() {
	const { user } = useAuth();

	return (
		<ScrollView style={styles.container}>
			<StatusBar barStyle="light-content" />

			<View>
				<Text>Station</Text>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		display: "flex",
		flexDirection: "column",
		backgroundColor: "#000",
		padding: 20,
		paddingTop: 120,
	},
});
