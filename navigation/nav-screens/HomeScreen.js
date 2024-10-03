import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const HomeScreen = () => {

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 42.35734191019774, // Set initial latitude
          longitude: -83.06971152534359, // Set initial longitude
          latitudeDelta: 0.00288125, // Zoom level latitude
          longitudeDelta: 0.001315625, // Zoom level longitude
        }}
      >
        <Marker
          coordinate={{ latitude: 37.78825, longitude: -122.4324 }} // Sample marker coordinates
          title="Marker Title"
          description="Marker Description"
        />
      </MapView>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});
