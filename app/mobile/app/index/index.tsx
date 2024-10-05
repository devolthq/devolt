import { useAuth } from "@/hooks/useAuth";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { PanGestureHandler } from "react-native-gesture-handler";
import Animated, {
	useAnimatedGestureHandler,
	useSharedValue,
	withSpring,
	useAnimatedStyle,
	useDerivedValue,
} from "react-native-reanimated";
import * as Location from "expo-location";
import { sharedStyles } from "./_layout";
import { Station, stations } from "@/constants/Stations";

export default function Home() {
	const { isLoggedIn, isLoading, logout, user } = useAuth();
	const hasNavigatedRef = useRef(false);

	const MIN_HEIGHT = 60;
	const MAX_HEIGHT = 750;
	const DEFAULT_HEIGHT = 300;

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

	const [isPressed, setIsPressed] = useState(false);
	const [location, setLocation] = useState(null);
	const [region, setRegion] = useState(null);
	const mapRef = useRef(null);

	const focusUserLocation = () => {
		if (location) {
			const newRegion = {
				latitude: location.latitude,
				longitude: location.longitude,
				latitudeDelta: 0.01,
				longitudeDelta: 0.01,
			};

			if (translateY.value === MAX_HEIGHT) {
				translateY.value = withSpring(DEFAULT_HEIGHT, {
					damping: 50,
				});
			}
			if (translateY.value === DEFAULT_HEIGHT) {
				translateY.value = withSpring(MIN_HEIGHT, {
					damping: 50,
				});
			}

			setRegion(newRegion);
			mapRef.current.animateToRegion(newRegion, 1000);
		}
	};

	useEffect(() => {
		(async () => {
			let { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== "granted") {
				console.error("Permission to access location was denied");
				return;
			}

			let loc = await Location.getCurrentPositionAsync({});
			setLocation(loc.coords);
			setRegion({
				latitude: loc.coords.latitude,
				longitude: loc.coords.longitude,
				latitudeDelta: 0.01,
				longitudeDelta: 0.01,
			});
		})();

		console.log("user", user);
	}, []);

	const renderStationCard = ({ item }: { item: Station }) => {
		return (
			<Pressable style={styles.card} onPress={() => {
				router.push(`/station`);
			}}>
				<Text style={styles.stationName}>{item.address}</Text>
				<Text style={styles.stationDistance}>
					{Math.round(item.batteryLevel)}% | {item.availablePlugs}
				</Text>

				<Text style={styles.stationDistance}>
					{Math.round(item.meanPrice)} kWh | {item.maxVoltage} V
				</Text>
			</Pressable>
		);
	};

	return (
		<View style={styles.container}>
			<StatusBar barStyle="dark-content" />

			<View style={styles.mapContainer}>
				{region ? (
					<MapView
						ref={mapRef}
						style={styles.map}
						initialRegion={region}
						showsUserLocation={true}
						followsUserLocation={true}
						mapType="terrain"
						loadingBackgroundColor="#e1e1e1"
						loadingEnabled={true}
						loadingIndicatorColor="#1e1e1e"
					>
						{stations.map((station) => (
							<Marker
								key={station.id}
								coordinate={{
									latitude: station.latitude,
									longitude: station.longitude,
								}}
								title={station.address}
								pinColor="#42FF4E"
							/>
						))}
					</MapView>
				) : (
					<ActivityIndicator size="large" color="#e1e1e1" />
				)}
			</View>

			<PanGestureHandler onGestureEvent={gestureHandler}>
				<Animated.View style={[styles.cardContainer, animatedStyle]}>
					<Pressable
						style={styles.topBarHeader}
						onPress={() => {
							translateY.value = withSpring(
								translateY.value === MIN_HEIGHT
									? DEFAULT_HEIGHT
									: MIN_HEIGHT,
								{
									damping: 50,
								}
							);
						}}
					>
						<View style={styles.hairline} />
					</Pressable>

					<View style={styles.welcomeContainer}>
						<Text style={styles.welcomeTitle}>
							Welcome {user?.name}!
						</Text>

						<Pressable
							onPress={focusUserLocation}
							onPressIn={() => setIsPressed(true)}
							onPressOut={() => setIsPressed(false)}
							style={styles.button}
						>
							<Ionicons
								name="navigate"
								size={24}
								color={isPressed ? "#4a4a4a" : "#fff"}
							/>
						</Pressable>
					</View>

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
	mapContainer: {
		flex: 1,
		backgroundColor: "#e1e1e1",
		...sharedStyles.centerContent,
	},
	map: {
		width: "100%",
		height: "100%",
	},
	topBarHeader: {
		width: "100%",
		paddingVertical: 20,
	},
	hairline: {
		width: "50%",
		alignSelf: "center",
		height: 3,
		borderRadius: 1,
		backgroundColor: "#ffffffbf",
	},
	placeholderText: {
		color: "#000",
		fontSize: 18,
	},
	cardContainer: {
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: -5,
		},
		shadowOpacity: 0.25,
		shadowRadius: 6.27,
		elevation: 10,
		backgroundColor: "#000000",
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		paddingBottom: 20,
		paddingHorizontal: 10,
		position: "absolute",
		bottom: 0,
		width: "100%",
		zIndex: 100,
	},
	welcomeContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 10,
		marginBottom: 10,
	},
	welcomeTitle: {
		fontSize: 22,
		fontWeight: "bold",
		color: "#fff",
	},
	title: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#fff",
		marginBottom: 10,
		paddingLeft: 10,
	},
	cardList: {
		gap: 20,
	},
	card: {
		width: width * 0.4,
		backgroundColor: "#1e1e1e",
		height: 200,
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
	button: {
		width: 50,
		height: 50,
		borderRadius: 25,
		...sharedStyles.centerContent,
	},
	buttonPressed: {
		backgroundColor: "#333",
	},
});
