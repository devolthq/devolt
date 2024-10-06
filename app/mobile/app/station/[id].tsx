import { View, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import * as Location from "expo-location";
import { Station, stations } from "@/constants/Stations";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import MapView, { Marker } from "react-native-maps";

export default function StationDetail() {
	const { id } = useLocalSearchParams();
	const [station, setStation] = useState<Station>(null);

	const [location, setLocation] = useState(null);
	const [region, setRegion] = useState(null);
	const mapRef = useRef(null);

	useEffect(() => {
		(async () => {
			let { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== "granted") {
				console.error("Permission to access location was denied");
				return;
			}

			let loc = await Location.getCurrentPositionAsync({});
			setLocation(loc.coords);
		})();
	}, [id]);

	useEffect(() => {
		const selectedStation = stations.find((s) => s.id === id);
		setStation(selectedStation);
		if (selectedStation) {
			setRegion({
				latitude: selectedStation.latitude,
				longitude: selectedStation.longitude,
				latitudeDelta: 0.01,
				longitudeDelta: 0.01,
			});
		}
	}, [id]);

	return (
		<View style={styles.container}>
			<StatusBar style="inverted" />
			<View style={styles.mapContainer}>
				{region && station ? (
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
						<Marker
							coordinate={{
								latitude: station.latitude,
								longitude: station.longitude,
							}}
							title={station.address}
							description={`Charger: ${station.availablePlugs}`}
						/>
					</MapView>
				) : (
					<ActivityIndicator size="large" color="#e1e1e1" />
				)}
			</View>
			<ScrollView style={styles.contentContainer}>
				{/* Add other content here */}
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#101010",
	},
	mapContainer: {
		height: 400,
	},
	map: {
		flex: 1,
	},
	contentContainer: {
		flex: 1,
		padding: 20,
	},
});
