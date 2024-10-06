import React, { useEffect, useRef, useState } from "react";
import {
	View,
	Text,
	StatusBar,
	Alert,
	ScrollView,
	Pressable,
	StyleSheet,
	Dimensions,
} from "react-native";
import { useAuth } from "@/hooks/useAuth";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Link } from "expo-router";
import * as Location from "expo-location";
import { PanGestureHandler } from "react-native-gesture-handler";
import Animated, {
	useAnimatedGestureHandler,
	useSharedValue,
	useAnimatedStyle,
	withSpring,
} from "react-native-reanimated";
import { Station, stations } from "@/constants/Stations";
import { sharedStyles } from "./_layout";
import { MapComponent } from "./components/Map";
import { BuyEnergyContainer } from "./components/BuyEnergyContainer";
import { StationCard } from "./components/StationCard";
import { ToggleButton } from "./components/ToggleButton";
import { SellEnergyContainer}from "./components/SellEnergyContainer";

console.log("stations", stations);

export default function Home() {
	const { user } = useAuth();
	const [selectedStation, setSelectedStation] = useState<Station | null>(
		null
	);
	const [location, setLocation] = useState(null);
	const [region, setRegion] = useState(null);
	const mapRef = useRef(null);

	const MIN_HEIGHT = 70;
	const MAX_HEIGHT = 750;
	const DEFAULT_HEIGHT = 300;

	const translateY = useSharedValue(DEFAULT_HEIGHT);
	const [mode, setMode] = useState<0 | 1>(0);

	const translateYAnim = useAnimatedStyle(() => ({
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
				translateY.value = withSpring(MIN_HEIGHT, {
					damping: 20,
					stiffness: 90,
				});
			} else if (translateY.value < MAX_HEIGHT / 2) {
				translateY.value = withSpring(DEFAULT_HEIGHT, {
					damping: 20,
					stiffness: 90,
				});
			} else {
				translateY.value = withSpring(MAX_HEIGHT, {
					damping: 20,
					stiffness: 90,
				});
			}
		},
	});

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
	}, []);

	const handlePurchase = () => {
		if (!selectedStation) {
			Alert.alert("Error", "Please select a station.");
			return;
		}
		Alert.alert(
			"Success",
			`You have purchased energy at ${selectedStation.address}!`
		);
	};

	const handleSellEnergy = (data) => {
		if (!data.generationMethod || !data.amount) {
			Alert.alert("Error", "Please fill in all required fields.");
			return;
		}

		Alert.alert("Success", "You have sold your energy!");
	};

	const [isPressed, setIsPressed] = useState(false);

	const focusUserLocation = () => {
		if (location) {
			const newRegion = {
				latitude: location.latitude,
				longitude: location.longitude,
				latitudeDelta: 0.01,
				longitudeDelta: 0.01,
			};

			if (translateY.value != DEFAULT_HEIGHT) {
				translateY.value = withSpring(DEFAULT_HEIGHT, {
					damping: 20,
					stiffness: 90,
				});
			}

			setRegion(newRegion);
			mapRef.current.animateToRegion(newRegion, 1000);
		}
	};

	return (
		<View style={styles.container}>
			<StatusBar barStyle="dark-content" />

			<View style={styles.mapContainer}>
				<MapComponent region={region} mapRef={mapRef} />
			</View>

			<PanGestureHandler onGestureEvent={gestureHandler}>
				<Animated.View style={[styles.cardContainer, translateYAnim]}>
					<Pressable
						style={styles.topBarHeader}
						onPress={() => {
							translateY.value = withSpring(
								translateY.value === MIN_HEIGHT
									? DEFAULT_HEIGHT
									: MIN_HEIGHT,
								{ damping: 20, stiffness: 90 }
							);
						}}
					>
						<View style={styles.hairline} />
					</Pressable>

					<ScrollView>
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

						<ToggleButton mode={mode} setMode={setMode} />

						{stations &&
							(mode === 0 && stations && stations.length > 0 ? (
								<>
									{user?.vehicle && (
										<Text
											style={{
												...styles.title,
												paddingBottom: 10,
											}}
										>
											Ready to charge your{" "}
											<Text style={{ color: "#42FF4E" }}>
												{user?.vehicle?.manufacturer}{" "}
												{user?.vehicle?.model}
											</Text>{" "}
											with DeVolt?
										</Text>
									)}
									<Text style={styles.title}>
										Select a Station
									</Text>
									<ScrollView
										horizontal
										contentContainerStyle={styles.cardList}
									>
										{stations.map((station) => (
											<StationCard
												key={station.id}
												item={station}
												selectedStation={
													selectedStation
												}
												onSelect={() => {
													if (
														selectedStation &&
														selectedStation.id ===
															station.id
													) {
														setSelectedStation(
															null
														);
													} else {
														setSelectedStation(
															station
														);
													}
												}}
											/>
										))}
									</ScrollView>
									{selectedStation ? (
										<BuyEnergyContainer
											user={user}
											selectedStation={selectedStation}
											onPurchase={handlePurchase}
										/>
									) : (
										<Text
											style={{
												color: "#fff",
												textAlign: "center",
												marginTop: 20,
											}}
										>
											Select a station to purchase energy
										</Text>
									)}
								</>
							) : mode === 1 ? (
								<SellEnergyContainer
									user={user}
									onSell={handleSellEnergy}
								/>
							) : null)}

						{!stations || stations.length === 0 ? (
							<View
								style={{
									flex: 1,
									justifyContent: "center",
									alignItems: "center",
								}}
							>
								<Text
									style={{
										color: "#fff",
										fontSize: 20,
										textAlign: "center",
									}}
								>
									No stations available
								</Text>
							</View>
						) : null}
					</ScrollView>
				</Animated.View>
			</PanGestureHandler>
		</View>
	);
}

const { width, height } = Dimensions.get("window");

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
	cardContainer: {
		backgroundColor: "#101010",
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		paddingBottom: 40,
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
		fontSize: 24,
		fontWeight: "bold",
		color: "#fff",
	},
	title: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#fff",
		marginBottom: 10,
	},
	button: {},
	toggleButtonContainer: {
		flexDirection: "column",
		alignItems: "center",
		marginBottom: 20,
		height: 60,
		width: "100%",
	},
	toggleButtons: {
		flexDirection: "row",
		alignItems: "center",
		width: "100%",
	},
	buyButton: {
		backgroundColor: "#42FF4E",
		borderRadius: 10,
		alignItems: "center",
		justifyContent: "center",
		height: "100%",
		flex: 1,
		marginRight: 5,
	},
	sellButton: {
		backgroundColor: "#101010",
		borderWidth: 2,
		borderColor: "#42FF4E",
		borderRadius: 10,
		alignItems: "center",
		justifyContent: "center",
		height: "100%",
		flex: 1,
		marginLeft: 5,
	},
	buyText: {
		color: "#000",
		fontSize: 16,
		fontWeight: "bold",
	},
	sellText: {
		color: "#42FF4E",
		fontSize: 16,
		fontWeight: "bold",
	},
	cardList: {
		gap: 10,
		marginBottom: 10,
	},
	card: {
		width: width * 0.4,
		backgroundColor: "#101010",
		borderRadius: 10,
		padding: 15,
		height: 150,
	},
	selectedCard: {
		borderColor: "#42FF4E",
		borderWidth: 2,
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
	input: {
		backgroundColor: "#101010",
		color: "#fff",
		paddingHorizontal: 10,
		paddingVertical: 5,
		marginVertical: 10,
		borderRadius: 10,
	},
	purchaseButton: {
		backgroundColor: "#42FF4E",
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 10,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		marginTop: 10,
	},
	purchaseButtonText: {
		color: "#1e1e1e",
		fontSize: 20,
		fontWeight: "600",
		marginLeft: 10,
	},
	sellTextContent: {
		color: "#fff",
		fontSize: 24,
		fontWeight: "bold",
		textAlign: "center",
		marginTop: 20,
	},
	stationDetails: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "bold",
		marginBottom: 10,
	},
});
