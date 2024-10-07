import React from "react";
import { Pressable, Text, StyleSheet, Dimensions, View } from "react-native";
import { Station } from "@/constants/Stations";
import { useAuth } from "@/hooks/useAuth";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
} from "react-native-reanimated";

interface StationCardProps {
    item: Station;
    selectedStation: Station | null;
    onSelect: (station: Station) => void;
}

export const StationCard: React.FC<StationCardProps> = ({
    item,
    selectedStation,
    onSelect,
}) => {
    const { user } = useAuth();
    const vehicle = user?.vehicle;

    const vehiclePlugType = vehicle?.manufacturer ?? "";
    const isCompatible = vehicle
        ? item.availablePlugs
                .map((plug) => plug.toLowerCase())
                .includes(vehiclePlugType.toLowerCase())
        : true;

    const shakeAnim = useSharedValue(0);

    const handlePress = () => {
        if (isCompatible) {
            onSelect(item);
        } else {
            shakeAnim.value = withSequence(
                withTiming(-10, { duration: 50 }),
                withTiming(10, { duration: 50 }),
                withTiming(-10, { duration: 50 }),
                withTiming(10, { duration: 50 }),
                withTiming(0, { duration: 50 })
            );
        }
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: shakeAnim.value }],
        borderColor: !isCompatible ? "#ff6c6c" : "transparent",
        borderWidth: !isCompatible ? 2 : 0,
    }));

    if (!isCompatible) {
        return null;
    }

    return (
        <Animated.View
            style={[
                styles.card,
                animatedStyle,
                selectedStation?.id === item.id && styles.selectedCard,
            ]}
        >
            <Pressable style={styles.pressable} onPress={handlePress}>
                <Text style={styles.stationName}>{item.address}</Text>
                <Text style={styles.stationDetails}>
                    {Math.round(item.batteryLevel)}% |{" "}
                    {item.availablePlugs.join(", ")} plugs
                </Text>
                <Text style={styles.stationDetails}>
                    {Math.round(item.meanPrice)} kWh | {item.maxVoltage} V
                </Text>
            </Pressable>
        </Animated.View>
    );
};

const { width } = Dimensions.get("window");
const styles = StyleSheet.create({
    card: {
        width: width * 0.5,
        backgroundColor: "#000",
        borderRadius: 10,
        padding: 15,
        minHeight: 150,
    },
    pressable: {
        flex: 1,
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
    stationDetails: {
        color: "#fff",
        fontSize: 14,
    },
});