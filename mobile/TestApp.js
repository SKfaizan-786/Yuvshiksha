import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TestApp() {
  console.log('📱 TestApp is rendering!');
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello from Yuvsiksha Mobile! 🎓</Text>
      <Text style={styles.subtext}>If you see this, React Native is working!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});