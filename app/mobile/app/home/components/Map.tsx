import React from 'react';
import MapView, { Marker, MapViewProps, Region } from 'react-native-maps';
import { stations } from '@/constants/Stations';
import markerDeVolt from '@/assets/images/marker-devolt.png';
import { ActivityIndicator } from 'react-native';

interface MapComponentProps extends MapViewProps {
  region: Region | null;
  mapRef: React.RefObject<MapView>;
}

export const MapComponent: React.FC<MapComponentProps> = ({ region, mapRef, ...props }) => {
  return region ? (
		<MapView
			ref={mapRef}
			style={{ width: "100%", height: "100%" }}
			initialRegion={region}
			showsUserLocation
			followsUserLocation
			mapType="terrain"
			{...props}
		>
			{stations.map((station) => (
				<Marker
					icon={markerDeVolt}
					key={station.id}
					coordinate={{
						latitude: station.latitude,
						longitude: station.longitude,
					}}
					title={station.address}
					pinColor="#2db637"
				/>
			))}
		</MapView>
  ) : (
		<ActivityIndicator size="large" color="#e1e1e1" />
  );
};
