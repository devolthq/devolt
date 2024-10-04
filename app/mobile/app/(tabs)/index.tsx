import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import LoginScreen from "../pages/loginScreen/LoginScreen";
import Page1 from "../pages/onboard/Page1";

export default function HomeScreen() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <Text style={styles.splashText}>Taking electric vehicles further.</Text>
      </View>
    );
  }

  return (
    <>
      {/* <LoginScreen /> */}
      <Page1/>  
    </>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  splashText: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: "bold",
  },
});
