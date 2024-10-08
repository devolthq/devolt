import React, { useEffect, useRef, useState } from "react";
import {
	View,
	Text,
	Alert,
	ScrollView,
	Pressable,
	StyleSheet,
	Dimensions,
	ActivityIndicator,
	TouchableOpacity,
	Image,
} from "react-native";
import { useAuth, User } from "@/hooks/useAuth";
import Ionicons from "@expo/vector-icons/Ionicons";
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
import {
	SellData,
	SellEnergyContainer,
} from "./components/SellEnergyContainer";
import { ExternalLink } from "@/components/ExternalLink";
import { buyEnergy, sellEnergy } from "@/services/paymentEngineService";
import { RPC_URL } from "@/constants/Solana";
import { StatusBar } from "expo-status-bar";

export default function Home() {
	const { getUser, isLoggedIn } = useAuth();
	const [user, setUser] = useState<User | null>(null);

	useEffect(() => {
		if (isLoggedIn) {
			getUser().then((user) => {
				setUser(user);
			});
		}
	}, [isLoggedIn]);

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

	const [transactionLoading, setTransactionLoading] = useState(false);
	const [transactionUrl, setTransactionUrl] = useState<string>();
	const [buyValue, setBuyValue] = useState("");

	const handlePurchase = async (batteryAmount: string) => {
		if (!selectedStation) {
			Alert.alert("Error", "Please select a station.");
			return;
		}

		try {
			setTransactionLoading(true);
			translateY.value = withSpring(250, {
				damping: 20,
				stiffness: 90,
			});

			const energyAmount = parseFloat(batteryAmount);
			setBuyValue(batteryAmount);
			const response = await buyEnergy(energyAmount);

			const url = `https://solscan.io/tx/${response.signature}?cluster=custom&${RPC_URL}`;
			setTransactionUrl(url);
		} catch (error) {
			console.error("Error buying energy:", error);
			Alert.alert("Error", "Failed to buy energy. Please try again.");
		} finally {
			setTransactionLoading(false);
			translateY.value = withSpring(375, {
				damping: 20,
				stiffness: 90,
			});
		}
	};

	const handleSellEnergy = async (data: SellData) => {
		if (!data.generationMethod || !data.amount) {
			Alert.alert("Error", "Please fill in all required fields.");
			return;
		}

		try {
			setTransactionLoading(true);
			translateY.value = withSpring(250, {
				damping: 20,
				stiffness: 90,
			});

			const energyAmount = parseFloat(data.amount);
			const usdcAmount = energyAmount / 100;

			const response = await sellEnergy(usdcAmount);
			// https://solscan.io/tx/EzXCixpCVJy1tizwumuyY4Jb5AbjN4zcLwDzFMkQtHxhoEr9VF368wTk2NFWojX4C1pddKqdkAEg4CdG6Savsde?cluster=custom&customUrl=https://8e80-2a01-4f9-1a-b149-00-2.ngrok-free.app
			const url = `https://solscan.io/tx/${response.signature}?cluster=custom&customUrl=${RPC_URL}`;
			setTransactionUrl(url);
		} catch (error) {
			console.error("Error selling energy:", error);
			Alert.alert("Error", "Failed to sell energy. Please try again.");
		} finally {
			setTransactionLoading(false);
			translateY.value = withSpring(375, {
				damping: 20,
				stiffness: 90,
			});
		}
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
			<StatusBar style="dark" />

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

					<ScrollView
						style={{
							flex: 1,
							height: "100%",
						}}
						alwaysBounceVertical={false}
					>
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

						{!transactionLoading && !transactionUrl && (
							<>
								<View
									style={{
										...styles.toggleButtonContainer,
										marginBottom: 0,
										alignItems: "flex-start",
										width: "100%",
										justifyContent: "space-between",
										flexDirection: "row",
										alignContent: "center",
										paddingHorizontal: 20,
									}}
								>
									<Text
										style={{
											...styles.title,
											fontSize: 24,
										}}
									>
										{mode === 0
											? "Buy Energy"
											: "Sell Energy"}
									</Text>
									<ToggleButton
										mode={mode}
										setMode={setMode}
									/>
								</View>

								{stations &&
									(mode === 0 && stations.length > 0 ? (
										<>
											{user?.vehicle && (
												<Text
													style={{
														...styles.title,
														paddingBottom: 10,
														marginHorizontal: 20,
													}}
												>
													Ready to charge your{" "}
													<Text
														style={{
															color: "#42FF4E",
														}}
													>
														{
															user?.vehicle
																?.manufacturer
														}{" "}
														{user?.vehicle?.model}
													</Text>{" "}
													with DeVolt?
												</Text>
											)}
											<Text
												style={{
													...styles.title,
													marginHorizontal: 20,
												}}
											>
												Select a Station
											</Text>
											<ScrollView
												horizontal
												contentContainerStyle={
													styles.cardList
												}
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
													selectedStation={
														selectedStation
													}
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
													Select a station to purchase
													energy
												</Text>
											)}
										</>
									) : mode === 1 ? (
										<SellEnergyContainer
											onSell={handleSellEnergy}
										/>
									) : null)}

								{(!stations || stations.length === 0) && (
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
								)}
							</>
						)}

						{transactionLoading && (
							<View style={styles.loadingContainer}>
								<ActivityIndicator
									size="large"
									color="#42FF4E"
								/>
								<Text
									style={{
										color: "#aaa",
										fontSize: 16,
									}}
								>
									Processing your transaction...
								</Text>
								<Text
									style={{
										color: "#aaa",
										fontSize: 16,
									}}
								>
									Hang on tight!
								</Text>
							</View>
						)}

						{transactionUrl && (
							<View style={styles.successContainer}>
								<View
									style={{
										alignItems: "center",
									}}
								>
									<Text style={styles.successText}>
										Transaction successful!
									</Text>
									{mode === 0 && (
										<Text
											style={{
												color: "#fff",
												fontSize: 16,
												textAlign: "center",
											}}
										>
											You have successfully purchased $
											{buyValue} worth of energy.
										</Text>
									)}
									{mode === 1 && (
										<Text
											style={{
												color: "#fff",
												fontSize: 16,
												textAlign: "center",
											}}
										>
											DeVolt will now analyze your energy
											sale and credit your account.
										</Text>
									)}

									<ExternalLink
										href={transactionUrl}
										style={{
											color: "#42FF4E",
											textAlign: "center",
											marginBottom: 20,
											alignItems: "center",
											textDecorationLine: "underline",
										}}
										onPress={() => {
											console.log(transactionUrl);
										}}
									>
										View transaction{" "}
										<Ionicons name="link" size={16} />
									</ExternalLink>

									<TouchableOpacity
										style={styles.backButton}
										onPress={() => {
											focusUserLocation();
											setSelectedStation(null);
											setBuyValue("");
											setTransactionUrl(null);
										}}
									>
										<Text style={styles.backButtonText}>
											Go Back
										</Text>
									</TouchableOpacity>
								</View>
							</View>
						)}
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
		paddingBottom: 40,
		// paddingHorizontal: 10,
		position: "absolute",
		bottom: 0,
		width: "100%",
		zIndex: 100,
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: -10,
		},
		shadowOpacity: 0.3,
		shadowRadius: 20,
	},
	welcomeContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 15,
		paddingHorizontal: 20,
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
		marginVertical: 10,
		paddingLeft: 10,
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
	loadingContainer: {
		flex: 1,
		display: "flex",
		height: "100%",
		marginTop: 20,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 20,
	},
	successContainer: {
		marginHorizontal: 20,
		padding: 20,
		backgroundColor: "#1e1e1e",
		borderRadius: 10,
		marginVertical: 10,
	},
	successText: {
		color: "#fff",
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 10,
	},
	qrPlaceholder: {
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		alignContent: "center",
		width: "100%",
		borderRadius: 40,
		marginBottom: 10,
	},
	backButton: {
		marginTop: 20,
		paddingVertical: 10,
		paddingHorizontal: 20,
		backgroundColor: "#42FF4E",
		borderRadius: 10,
		alignItems: "center",
	},
	backButtonText: {
		color: "#1e1e1e",
		fontSize: 16,
		fontWeight: "600",
	},
});
