import React, { useState } from "react";
import {
	View,
	Text,
	Modal,
	TouchableOpacity,
	FlatList,
	StyleSheet,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

interface CustomPickerProps {
	items: Array<{ label: string; value: any }>;
	selectedValue: any;
	onValueChange: (value: any) => void;
	placeholder?: string;
}

export const CustomPicker: React.FC<CustomPickerProps> = ({
	items,
	selectedValue,
	onValueChange,
	placeholder,
}) => {
	const [modalVisible, setModalVisible] = useState(false);

	const selectedItem = items.find((item) => item.value === selectedValue);

	return (
		<View>
			<TouchableOpacity
				style={styles.input}
				onPress={() => setModalVisible(true)}
			>
				<Text style={styles.inputText}>
					{selectedItem
						? selectedItem.label
						: placeholder || "Select an option"}
				</Text>
				<Ionicons name="chevron-down" size={20} color="#fff" />
			</TouchableOpacity>

			<Modal
				transparent={true}
				visible={modalVisible}
				animationType="slide"
			>
				<TouchableOpacity
					style={styles.modalOverlay}
					activeOpacity={1}
					onPressOut={() => setModalVisible(false)}
				>
					<View style={styles.modalContent}>
						<FlatList
							data={items}
							keyExtractor={(item) => item.value?.toString()}
							renderItem={({ item }) => (
								<TouchableOpacity
									style={styles.modalItem}
									onPress={() => {
										onValueChange(item.value);
										setModalVisible(false);
									}}
								>
									<Text style={styles.modalItemText}>
										{item.label}
									</Text>
								</TouchableOpacity>
							)}
						/>
					</View>
				</TouchableOpacity>
			</Modal>
		</View>
	);
};

const styles = StyleSheet.create({
	input: {
		backgroundColor: "#1e1e1e",
		color: "#fff",
		paddingHorizontal: 10,
		paddingVertical: 12,
		borderRadius: 10,
		marginBottom: 15,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	inputText: {
		color: "#fff",
		fontSize: 16,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: "#00000099",
		justifyContent: "center",
	},
	modalContent: {
		backgroundColor: "#101010",
		marginHorizontal: 20,
		borderRadius: 10,
		maxHeight: "80%",
	},
	modalItem: {
		padding: 15,
		borderBottomColor: "#1e1e1e",
		borderBottomWidth: 1,
	},
	modalItemText: {
		color: "#fff",
		fontSize: 16,
	},
});
