import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const WelcomeScreen = ({ navigation }) => {
  // Automatically navigate to the Login screen after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 3000); // 3 seconds delay

    return () => clearTimeout(timer); // Clear timer if the component is unmounted
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image 
        source={require('../assets/campusconnects.png')} // Adjust the path as necessary
        style={styles.logo}
      />
      <Text style={styles.welcomeText}>
        Campus{' '}
        <Text style={styles.connectText}>Connects</Text>
      </Text>
      <Text style={styles.bottomText}>Meet, plan, and thrive!</Text>
    </View>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  connectText:{
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0C5449',
  },
  bottomText: {
    position: 'absolute',
    bottom: 30, 
    fontWeight: 'bold',
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
  },
});
