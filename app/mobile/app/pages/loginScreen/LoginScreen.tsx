import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {

    if (email === "" || password === "") {
      Alert.alert("Erro", "Preencha todos os campos");
    } else {
      Alert.alert("Sucesso", `Logado com o email: ${email}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={(text) => setEmail(text)}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={password}
        onChangeText={(text) => setPassword(text)}
        secureTextEntry={true}
      />
      <Button title="Entrar" onPress={handleLogin} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    height: 50,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
});

export default LoginScreen;
