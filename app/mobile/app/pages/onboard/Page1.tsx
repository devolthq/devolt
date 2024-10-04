import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Link } from 'expo-router';

export default function Page1() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.semiBoldText}>Bem-vindo à DeVolt</Text>
      <Text style={styles.headline}>A revolução da energia descentralizada</Text>
      <Image source={require('./assets/image1.png')} style={styles.image} />
      

      <TouchableOpacity style={styles.button} onPress={() => router.push('./Page2')}>
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  semiBoldText: {
    fontSize: 24,
    fontWeight: '600', 
    marginBottom: 10,
    color: '#161616',
  },
  headline: {
    fontSize: 20,
    fontWeight: '300', 
    marginBottom: 30,
    color: '#161616',
  },
  image: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#42FF4E',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  buttonText: {
    color: '#161616',
    fontSize: 16,
    fontWeight: 'bold',
  },
});