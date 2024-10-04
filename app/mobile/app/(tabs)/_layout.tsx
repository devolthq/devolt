import React from "react";
import { View } from "react-native";
import LoginScreen from "../pages/loginScreen/LoginScreen";
import HomeScreen from ".";

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <HomeScreen/>
    </View>
  );
}
