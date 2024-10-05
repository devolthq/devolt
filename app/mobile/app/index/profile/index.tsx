import { useAuth } from "@/hooks/useAuth";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import {
	View,
	Text,
	ActivityIndicator,
	StyleSheet,
	FlatList,
	Dimensions,
	Pressable,
	TextInput,
	StatusBar,
	ScrollView,
} from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";
import Animated, {
	useAnimatedGestureHandler,
	useSharedValue,
	withSpring,
	useAnimatedStyle,
} from "react-native-reanimated";
import { sharedStyles } from "../_layout";
import CreditCard from "@/components/CreditCard";

export default function Profile() {
	const { user } = useAuth();

	return (
		<ScrollView style={styles.container}>
			<StatusBar barStyle="light-content" />

			<View>
				<Text style={styles.title}>Profile</Text>

				<View>
					<Text style={styles.text}>Name: {user.name}</Text>
					<Text style={styles.text}>Email: {user.email}</Text>
				</View>
			</View>

			<View>
				<Text style={styles.title}>Financial information</Text>
				<CreditCard
					cardName={user.name}
					cardEnding={9999}
					cardExpiry={"12/25"}
				/>
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
        paddingHorizontal: 20,
		paddingTop: 120,
	},
	title: {
		color: "#fff",
		fontSize: 24,
		marginBottom: 20,
		fontWeight: "400",
	},
	text: {
		color: "#fff",
		fontSize: 16,
		marginBottom: 10,
	},
});
