import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Page2() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>A próxima etapa da DeVolt</Text>
      <Text style={styles.subtitle}>Siga em frente para descobrir mais sobre energia sustentável</Text>
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
  title: {
    fontSize: 24,
    fontWeight: '600', // semibold
    marginBottom: 10,
    color: '#161616',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '300', // light
    color: '#161616',
  },
});