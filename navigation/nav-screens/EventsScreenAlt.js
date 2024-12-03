import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const EventsScreenAlt = () => {
  return (
    <View style={styles.container}>

      <View style={styles.topContent}>
        <Image 
          source={require('../../assets/image6.png')}
          style={styles.bannerImage}
        />
        <Text style={styles.bannerText}>Events!!!</Text>
      </View>

     
      <View style={styles.bottomContent}>
        <Text style={styles.title}>More content here</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6E5E7',
  },
  topContent: {
    width: '100%',
    height: height * 0.3,
    justifyContent: 'center', 
    alignItems: 'center',   
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerText: {
    position: 'absolute', 
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: '#000',  
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  bottomContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default EventsScreenAlt;
