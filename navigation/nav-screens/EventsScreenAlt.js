import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity } from 'react-native';
import { useFonts } from 'expo-font';
import { Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';

const { width, height } = Dimensions.get('window');

const EventsScreenAlt = () => {
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  });

  const navigation = useNavigation();

  if (!fontsLoaded) {
    return (
      <View style={styles.container}>
        <Text>Loading fonts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topContent}>
        <Image
          source={require('../../assets/image6.png')}
          style={styles.bannerImage}
        />
        {/* <Text style={styles.bannerText}>Events</Text> */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => navigation.navigate('CreateEvent')}
          >
            <Icon name="plus" size={16} color="#000" style={styles.icon} />
            <Text style={styles.buttonText}>Create Event</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.button} 
            //onPress={() => navigation.navigate('Bookmarks')}
          >
            <Icon name="bookmark" size={16} color="#000" style={styles.icon} />
            <Text style={styles.buttonText}>View Bookmarks</Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: 10,
    position: 'relative',
    top: -100,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerText: {
    position: 'absolute',
    color: 'white',
    fontSize: 48,
    fontWeight: 'bold',
    fontFamily: 'Montserrat_600Semibold', 
    textAlign: 'center',
    // textShadowColor: '#000',
    // textShadowOffset: { width: 1, height: 1 },
    // textShadowRadius: 5,
    center: 25,
  },
  bottomContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Montserrat_400Regular', 
  },
  buttonContainer: {
    flexDirection: 'row',
    //justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    top: '70%',
    left: 20,
    right: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 30,
    paddingVertical: 20,
    paddingHorizontal: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Montserrat_500Medium',
    textAlign: 'center',
    marginLeft: 5,
  },
  icon: {
    marginRight: 5,
  },
});

export default EventsScreenAlt;
