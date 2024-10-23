import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TextInput, Alert, Modal, Text, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

const GOOGLE_MAPS_API_KEY = 'AIzaSyDErTBfHz5vRT8AafrF1B5PgErR8MKJAsk';

const WSU_BOUNDARIES = [
  { latitude: 42.364250, longitude: -83.080500 }, // Northwest
  { latitude: 42.364250, longitude: -83.058500 }, // Northeast
  { latitude: 42.348750, longitude: -83.058500 }, // Southeast
  { latitude: 42.348750, longitude: -83.080500 }, // Southwest
];

const isPointInPolygon = (point, polygon) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].latitude, yi = polygon[i].longitude;
    const xj = polygon[j].latitude, yj = polygon[j].longitude;
    const intersect = ((yi > point.longitude) !== (yj > point.longitude))
      && (point.latitude < (xj - xi) * (point.longitude - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

const FILTER_OPTIONS = [
  { id: 'restaurant', label: 'Restaurants', icon: 'restaurant' },
  { id: 'school', label: 'Academic', icon: 'school' },
  { id: 'parking', label: 'Parking', icon: 'car' },
  { id: 'tourist_attraction', label: 'Attractions', icon: 'camera' },
];

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;

const WSU_REGION = {
  latitude: (WSU_BOUNDARIES[0].latitude + WSU_BOUNDARIES[2].latitude) / 2,
  longitude: (WSU_BOUNDARIES[0].longitude + WSU_BOUNDARIES[1].longitude) / 2,
  latitudeDelta: Math.abs(WSU_BOUNDARIES[0].latitude - WSU_BOUNDARIES[2].latitude) * 1.5,
  longitudeDelta: Math.abs(WSU_BOUNDARIES[0].longitude - WSU_BOUNDARIES[1].longitude) * 1.5 * ASPECT_RATIO,
};

// Observer (Subject)
class PlacesObserver {
  constructor() {
    this.observers = [];
    this.places = [];
    this.selectedPlace = null;
    this.searchQuery = '';
    this.autocompleteResults = [];
    this.activeFilter = null;
  }

  subscribe(observer) {
    this.observers.push(observer);
  }

  unsubscribe(observer) {
    this.observers = this.observers.filter(obs => obs !== observer);
  }

  notify() {
    this.observers.forEach(observer => observer(this));
  }

  setPlaces(places) {
    this.places = places;
    this.notify();
  }

  setSelectedPlace(place) {
    this.selectedPlace = place;
    this.notify();
  }

  setSearchQuery(query) {
    this.searchQuery = query;
    this.notify();
  }

  setAutocompleteResults(results) {
    this.autocompleteResults = results;
    this.notify();
  }

  setActiveFilter(filter) {
    this.activeFilter = filter;
    this.notify();
  }

  async fetchPlaces(query = '', filterType = null) {
    try {
      let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${WSU_REGION.latitude},${WSU_REGION.longitude}&radius=2000&key=${GOOGLE_MAPS_API_KEY}`;
      
      if (filterType) {
        url += `&type=${filterType}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        const filteredPlaces = data.results.filter(place => 
          isPointInPolygon({
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng
          }, WSU_BOUNDARIES)
        );
        this.setPlaces(filteredPlaces);
        if (filteredPlaces.length > 0) {
          this.setSelectedPlace(filteredPlaces[0]);
        } else {
          Alert.alert('No Results', 'No places found for the selected filter in this area.');
        }
      } else {
        Alert.alert('Error', 'Failed to fetch places.');
      }
    } catch (error) {
      console.error('Error fetching places:', error);
      Alert.alert('Error', 'An error occurred while fetching places.');
    }
  }

  async fetchAutocomplete(input) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&location=${WSU_REGION.latitude},${WSU_REGION.longitude}&radius=2000&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      if (data.status === 'OK') {
        this.setAutocompleteResults(data.predictions);
      }
    } catch (error) {
      console.error('Error fetching autocomplete results:', error);
    }
  }

  async fetchPlaceDetails(placeId) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,geometry,formatted_address,rating,types&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      if (data.status === 'OK') {
        this.setSelectedPlace(data.result);
        this.setPlaces([data.result]);
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
    }
  }
}

const placesObserver = new PlacesObserver();

const HomeScreen = () => {
  const [, forceUpdate] = useState();
  const [modalVisible, setModalVisible] = useState(false);
  const [region, setRegion] = useState(WSU_REGION);
  const mapRef = useRef(null);

  useEffect(() => {
    const updateComponent = () => forceUpdate({});
    placesObserver.subscribe(updateComponent);
    return () => placesObserver.unsubscribe(updateComponent);
  }, []);

  useEffect(() => {
    if (placesObserver.searchQuery.length > 2) {
      placesObserver.fetchAutocomplete(placesObserver.searchQuery);
    } else {
      placesObserver.setAutocompleteResults([]);
    }
  }, [placesObserver.searchQuery]);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setMapBoundaries(
        { latitude: Math.max(...WSU_BOUNDARIES.map(b => b.latitude)), longitude: Math.min(...WSU_BOUNDARIES.map(b => b.longitude)) },
        { latitude: Math.min(...WSU_BOUNDARIES.map(b => b.latitude)), longitude: Math.max(...WSU_BOUNDARIES.map(b => b.longitude)) }
      );
    }
  }, []);

  const handleSearch = async (placeId = null) => {
    if (placeId) {
      await placesObserver.fetchPlaceDetails(placeId);
      setModalVisible(true);
      setRegion({
        ...region,
        latitude: placesObserver.selectedPlace.geometry.location.lat,
        longitude: placesObserver.selectedPlace.geometry.location.lng,
      });
    } else {
      await placesObserver.fetchPlaces(placesObserver.searchQuery, placesObserver.activeFilter);
      setModalVisible(true);
    }
    placesObserver.setAutocompleteResults([]);
  };

  const handleMarkerPress = (place) => {
    placesObserver.setSelectedPlace(place);
    setModalVisible(true);
  };

  const clearSearch = () => {
    placesObserver.setSearchQuery('');
    placesObserver.setAutocompleteResults([]);
  };

  const handleFilterPress = (filterId) => {
    const newFilter = placesObserver.activeFilter === filterId ? null : filterId;
    placesObserver.setActiveFilter(newFilter);
    placesObserver.fetchPlaces('', newFilter);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="gray" style={styles.searchIcon} />
        <TextInput
          style={styles.searchBar}
          placeholder="Search buildings or businesses..."
          value={placesObserver.searchQuery}
          onChangeText={(text) => placesObserver.setSearchQuery(text)}
          onSubmitEditing={() => handleSearch()}
          returnKeyType="search"
        />
        {placesObserver.searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="gray" />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.filterContainer}>
        {FILTER_OPTIONS.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterButton,
              placesObserver.activeFilter === filter.id && styles.activeFilterButton
            ]}
            onPress={() => handleFilterPress(filter.id)}
          >
            <Ionicons name={filter.icon} size={20} color={placesObserver.activeFilter === filter.id ? 'white' : 'black'} />
            <Text style={[styles.filterText, placesObserver.activeFilter === filter.id && styles.activeFilterText]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {placesObserver.autocompleteResults.length > 0 && (
        <FlatList
          data={placesObserver.autocompleteResults}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.autocompleteItem}
              onPress={() => {
                placesObserver.setSearchQuery(item.description);
                handleSearch(item.place_id);
              }}
            >
              <Text>{item.description}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.place_id}
          style={styles.autocompleteList}
        />
      )}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={setRegion}
        minZoomLevel={14}
        maxZoomLevel={18}
      >
        <Polygon
          coordinates={WSU_BOUNDARIES}
          fillColor="rgba(0, 0, 255, 0.1)"
          strokeColor="rgba(0, 0, 255, 0.3)"
          strokeWidth={2}
        />
        {placesObserver.places.map((place, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng,
            }}
            title={place.name}
            description={place.formatted_address}
            onPress={() => handleMarkerPress(place)}
          />
        ))}
      </MapView>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            {placesObserver.selectedPlace && (
              <>
                <Text style={styles.modalTitle}>{placesObserver.selectedPlace.name}</Text>
                <Text style={styles.modalText}>Address: {placesObserver.selectedPlace.formatted_address}</Text>
                {placesObserver.selectedPlace.rating && (
                  <Text style={styles.modalText}>Rating: {placesObserver.selectedPlace.rating} / 5</Text>
                )}
                {placesObserver.selectedPlace.types && (
                  <Text style={styles.modalText}>Type: {placesObserver.selectedPlace.types.join(', ')}</Text>
                )}
              </>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.textStyle}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: 40,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    zIndex: 1,
    padding: 5,
  },
  searchIcon: {
    marginLeft: 10,
  },
  searchBar: {
    flex: 1,
    height: 40,
    fontSize: 16,
    paddingLeft: 10,
    paddingRight: 30,
  },
  clearButton: {
    position: 'absolute',
    right: 10,
    top: 12,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold"
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center"
  },
  closeButton: {
    backgroundColor: "#2196F3",
    borderRadius: 20,
    padding: 10,
    elevation: 2
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center"
  },
  autocompleteList: {
    position: 'absolute',
    top: 90,
    left: 10,
    right: 10,
    backgroundColor: 'white',
    zIndex: 2,
    maxHeight: 200,
  },
  autocompleteItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'absolute',
    top: 90,
    left: 10,
    right: 10,
    zIndex: 1,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  activeFilterButton: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    marginLeft: 5,
    fontSize: 12,
  },
  activeFilterText: {
    color: 'white',
  },
});

export default HomeScreen;