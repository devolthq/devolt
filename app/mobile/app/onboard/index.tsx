import React, { useState, useEffect } from "react";
import { View, Text, Image, StyleSheet, Pressable } from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
} from "react-native-reanimated";
import DeVoltLogo from "@/assets/images/devolt-logo.png";
import Car from "@/assets/images/car.png";
import { router } from "expo-router";

export default function Onboard() {
    const [showFirstView, setShowFirstView] = useState(true);
    const [isButtonPressed, setIsButtonPressed] = useState(false);
    const fadeAnim = useSharedValue(1);
    const slideAnim = useSharedValue(0);
    const secondFadeAnim = useSharedValue(0);
    const secondSlideAnim = useSharedValue(50);

    useEffect(() => {
        const timer = setTimeout(() => {
            fadeAnim.value = withTiming(0, { duration: 750 });
            slideAnim.value = withTiming(-50, { duration: 750 });

            setTimeout(() => {
                setShowFirstView(false);
                secondFadeAnim.value = withTiming(1, { duration: 500 });
                secondSlideAnim.value = withTiming(0, { duration: 500 });
            }, 500);
        }, 1500);

        return () => clearTimeout(timer);
    }, [fadeAnim, slideAnim, secondFadeAnim, secondSlideAnim]);

    const firstAnimatedStyle = useAnimatedStyle(() => ({
        opacity: fadeAnim.value,
        transform: [{ translateX: slideAnim.value }],
    }));

    const secondAnimatedStyle = useAnimatedStyle(() => ({
        opacity: secondFadeAnim.value,
        transform: [{ translateX: secondSlideAnim.value }],
    }));

    return (
        <View style={styles.container}>
            {showFirstView ? (
                <Animated.View
                    style={[styles.animatedContainer, firstAnimatedStyle]}
                >
                    <Image source={DeVoltLogo} />
                    <Text>Taking electric vehicles further.</Text>
                </Animated.View>
            ) : (
                <Animated.View
                    style={[styles.animatedContainer, secondAnimatedStyle]}
                >
                    <View style={styles.textContainer}>
                        <Text style={styles.semiBoldText}>
                            Welcome to DeVolt
                        </Text>
                        <Text style={styles.headline}>
                            A completely new way to use and trade energy, right
                            at your fingertips.
                        </Text>
                        <Image source={Car} />
                    </View>

                    <Pressable
                        style={({ pressed }) => [
                            styles.linkButton,
                            pressed && styles.buttonPressed,
                        ]}
                        onPressIn={() => setIsButtonPressed(true)}
                        onPressOut={() => setIsButtonPressed(false)}
                        onPress={() => router.push("/onboard/step-2")}
                    >
                        <Text style={styles.buttonLabel}>Next</Text>
                    </Pressable>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "space-around",
        alignItems: "center",
        padding: 20,
        backgroundColor: "#000",
    },
    semiBoldText: {
        fontSize: 24,
        fontWeight: "600",
        marginBottom: 10,
        color: "#fff",
    },
    headline: {
        fontSize: 20,
        fontWeight: "300",
        marginBottom: 30,
        color: "#fff",
        textAlign: "center",
    },
    textContainer: {
        alignItems: "center",
    },
    animatedContainer: {
        height: "75%",
        display: "flex",
        justifyContent: "space-evenly",
        alignItems: "center",
        width: "100%",
    },
    linkButton: {
        backgroundColor: "#42FF4E",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        alignItems: "center",
        justifyContent: "center",
        width: "80%",
    },
    buttonLabel: {
        fontSize: 18,
        color: "#000",
    },
    buttonPressed: {
        opacity: 0.5,
    },
});