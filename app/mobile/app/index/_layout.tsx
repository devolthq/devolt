import {
	DrawerContentScrollView,
	DrawerItemList,
	DrawerItem,
} from "@react-navigation/drawer";
import { Drawer } from "expo-router/drawer";
import * as SplashScreen from "expo-splash-screen";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, TextInput, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated from "react-native-reanimated";
import { useAuth } from "@/hooks/useAuth";
import Home from "@/index";

SplashScreen.preventAutoHideAsync();

function CustomHeader({ navigation, searchBar = true }) {
	const { logout } = useAuth();

	return (
		<Animated.View style={styles.topBar}>
			<Pressable
				onPress={() => navigation.toggleDrawer()}
				style={styles.menuButton}
			>
				<Ionicons name="menu" size={24} color="#fff" />
			</Pressable>

			{searchBar ?? (
				<View style={styles.searchBar}>
					<Ionicons
						name="search"
						size={24}
						color="#fff"
						style={styles.searchIcon}
					/>
					<TextInput
						placeholder="Search charging station"
						placeholderTextColor={"#aaa"}
						style={styles.searchInput}
					/>
				</View>
			)}
		</Animated.View>
	);
}

function CustomDrawerContent(props) {
	const { logout } = useAuth();

	return (
		<DrawerContentScrollView {...props}>
			<DrawerItemList {...props} />
			<DrawerItem
				label="Logout"
				icon={({ color, size }) => (
					<Ionicons name="log-out" color={color} size={size} />
				)}
				onPress={logout}
				labelStyle={{ color: "#FFF" }}
			/>
		</DrawerContentScrollView>
	);
}

export default function RootLayout() {
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<Drawer
				screenOptions={{
					header: (props) => <CustomHeader {...props} />,
					headerStyle: {
						backgroundColor: "#000",
					},
					drawerStyle: {
						backgroundColor: "#000",
					},
					drawerActiveTintColor: "#FFF",
					drawerInactiveTintColor: "#8a8a8a",
				}}
				drawerContent={(props) => <CustomDrawerContent {...props} />}
			>
				<Drawer.Screen
					name="index"
					options={{
						title: "Home",
						drawerIcon: ({ color, size }) => (
							<Ionicons name="home" color={color} size={size} />
						),
					}}
				/>
				<Drawer.Screen
					name="profile/index"
					options={{
						title: "Profile",
						header: (props) => (
							<CustomHeader {...props} searchBar={false} />
						),
						drawerIcon: ({ color, size }) => (
							<Ionicons name="person" color={color} size={size} />
						),
					}}
				/>
			</Drawer>
		</GestureHandlerRootView>
	);
}

export const sharedStyles = StyleSheet.create({
	centerContent: {
		justifyContent: "center",
		alignItems: "center",
	},
	rounded: {
		borderRadius: 10,
	},
	flexRow: {
		flexDirection: "row",
	},
	absoluteFullWidth: {
		position: "absolute",
		width: "100%",
	},
});

const styles = StyleSheet.create({
	topBar: {
		...sharedStyles.absoluteFullWidth,
		paddingTop: 60,
		paddingHorizontal: 20,
		zIndex: 1,
		...sharedStyles.flexRow,
		justifyContent: "space-between",
		gap: 10,
		width: "100%",
	},
	menuButton: {
		backgroundColor: "#000",
		...sharedStyles.rounded,
		width: 40,
		height: 40,
		...sharedStyles.centerContent,
	},
	searchBar: {
		...sharedStyles.flexRow,
		alignItems: "center",
		backgroundColor: "#000",
		height: 40,
		...sharedStyles.rounded,
		paddingHorizontal: 10,
		width: "85%",
	},
	searchIcon: {
		width: "10%",
	},
	searchInput: {
		color: "#fff",
		width: "90%",
		height: 40,
	},
	topBarButton: {
		backgroundColor: "#000",
		...sharedStyles.rounded,
		width: 40,
		height: 40,
		...sharedStyles.centerContent,
	},
});
