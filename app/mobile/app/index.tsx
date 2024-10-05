import { useAuth } from "@/hooks/useAuth";
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
} from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";
import Animated, {
	useAnimatedGestureHandler,
	useSharedValue,
	withSpring,
	useAnimatedStyle,
} from "react-native-reanimated";

export default function Page() {
	const { isLoggedIn, isLoading, logout } = useAuth();
	const hasNavigatedRef = useRef(false);

	// useEffect(() => {
	// 	if (!isLoading && !hasNavigatedRef.current) {
	// 		hasNavigatedRef.current = true;
	// 		if (!isLoggedIn) {
	// 			router.replace("/");
	// 		}
	// 	}
	// }, [isLoading, isLoggedIn]);

	// if (isLoading) {
	// 	return (
	// 		<View style={styles.container}>
	// 			<ActivityIndicator size="large" color="#e1e1e1" />
	// 		</View>
	// 	);
	// }

	const stations = [
		{ id: 1, name: "EV Station 1", distance: "0.5 mi" },
		{ id: 2, name: "EV Station 2", distance: "1.2 mi" },
		{ id: 3, name: "EV Station 3", distance: "2.1 mi" },
		{ id: 4, name: "EV Station 4", distance: "3.5 mi" },
	];

	const renderStationCard = ({ item }) => (
		<View style={styles.card}>
			<Text style={styles.stationName}>{item.name}</Text>
			<Text style={styles.stationDistance}>{item.distance}</Text>
		</View>
	);

	const MIN_HEIGHT = 100; // Mínimo de 100px
	const MAX_HEIGHT = 600; // Máximo de 600px
	const DEFAULT_HEIGHT = 300; // Altura padrão de 300px

	const translateY = useSharedValue(DEFAULT_HEIGHT);

	const animatedStyle = useAnimatedStyle(() => ({
		height: translateY.value,
	}));

	const gestureHandler = useAnimatedGestureHandler({
		onStart: (_, ctx) => {
			ctx.startY = translateY.value;
		},
		onActive: (event, ctx) => {
			translateY.value = ctx.startY - event.translationY;
			if (translateY.value < MIN_HEIGHT) {
				translateY.value = MIN_HEIGHT;
			}
			if (translateY.value > MAX_HEIGHT) {
				translateY.value = MAX_HEIGHT;
			}
		},
		onEnd: () => {
			if (translateY.value < DEFAULT_HEIGHT / 2) {
				translateY.value = withSpring(MIN_HEIGHT);
			} else if (translateY.value < MAX_HEIGHT / 2) {
				translateY.value = withSpring(DEFAULT_HEIGHT);
			} else {
				translateY.value = withSpring(MAX_HEIGHT);
			}
		},
	});

	return (
		<View style={styles.container}>
			<View style={styles.mapPlaceholder}>
				<Text style={styles.placeholderText}>Map Placeholder</Text>
				<Pressable onPress={logout}>
					<Text style={styles.placeholderText}>Logout</Text>
				</Pressable>
			</View>

			<PanGestureHandler onGestureEvent={gestureHandler}>
				<Animated.View style={[styles.cardContainer, animatedStyle]}>
					<View style={styles.hairline} />
					<Text style={styles.title}>EV Station Near You</Text>
					<FlatList
						data={stations}
						horizontal
						keyExtractor={(item) => item.id.toString()}
						renderItem={renderStationCard}
						contentContainerStyle={styles.cardList}
					/>
				</Animated.View>
			</PanGestureHandler>
		</View>
	);
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	mapPlaceholder: {
		flex: 1,
		backgroundColor: "#2E2E2E",
		justifyContent: "center",
		alignItems: "center",
	},
	hairline: {
		width: "50%",
		alignSelf: "center",
		height: 3,
		borderRadius: 1,
		backgroundColor: "#ffffffbf",
		marginVertical: 20,
	},
	placeholderText: {
		color: "#fff",
		fontSize: 18,
	},
	cardContainer: {
		backgroundColor: "#000",
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		paddingBottom: 20,
		paddingHorizontal: 10,
		position: "absolute",
		bottom: 0,
		width: "100%",
	},
	title: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#fff",
		marginBottom: 10,
		paddingLeft: 10,
	},
	cardList: {
		paddingLeft: 10,
	},
	card: {
		width: width * 0.4,
		height: 100,
		backgroundColor: "#1e1e1e",
		borderRadius: 10,
		padding: 15,
		marginRight: 10,
	},
	stationName: {
		color: "#fff",
		fontWeight: "bold",
		fontSize: 16,
		marginBottom: 5,
	},
	stationDistance: {
		color: "#fff",
		fontSize: 14,
	},
});
