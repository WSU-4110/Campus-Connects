import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TextInput, Alert, Modal, Text, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

// Replace this with your actual API key
const GOOGLE_MAPS_API_KEY = 'AIzaSyDErTBfHz5vRT8AafrF1B5PgErR8MKJAsk';

// Expanded Wayne State University area boundaries
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

const HomeScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [region, setRegion] = useState({
    latitude: 42.357341,
    longitude: -83.069711,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [autocompleteResults, setAutocompleteResults] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null);
  const mapRef = useRef(null);

  const fetchAutocomplete = async (input) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&location=${region.latitude},${region.longitude}&radius=2000&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      if (data.status === 'OK') {
        setAutocompleteResults(data.predictions);
      }
    } catch (error) {
      console.error('Error fetching autocomplete results:', error);
    }
  };

  const fetchPlaceDetails = async (placeId) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,geometry,formatted_address,rating,types&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      if (data.status === 'OK') {
        return data.result;
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
    }
    return null;
  };

  const fetchPlaces = async (query = '', filterType = null) => {
    try {
      let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${region.latitude},${region.longitude}&radius=2000&key=${GOOGLE_MAPS_API_KEY}`;
      
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
        setPlaces(filteredPlaces);
        if (filteredPlaces.length > 0) {
          setSelectedPlace(filteredPlaces[0]);
          setModalVisible(true);
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
  };

  useEffect(() => {
    if (searchQuery.length > 2) {
      fetchAutocomplete(searchQuery);
    } else {
      setAutocompleteResults([]);
    }
  }, [searchQuery]);

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
      const placeDetails = await fetchPlaceDetails(placeId);
      if (placeDetails) {
        setSelectedPlace(placeDetails);
        setModalVisible(true);
        setRegion({
          ...region,
          latitude: placeDetails.geometry.location.lat,
          longitude: placeDetails.geometry.location.lng,
        });
        setPlaces([placeDetails]);
      }
    } else {
      fetchPlaces(searchQuery, activeFilter);
    }
    setAutocompleteResults([]);
  };

  const handleMarkerPress = (place) => {
    setSelectedPlace(place);
    setModalVisible(true);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setAutocompleteResults([]);
  };

  const handleFilterPress = (filterId) => {
    setActiveFilter(activeFilter === filterId ? null : filterId);
    fetchPlaces('', activeFilter === filterId ? null : filterId);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="gray" style={styles.searchIcon} />
        <TextInput
          style={styles.searchBar}
          placeholder="Search buildings or businesses..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => handleSearch()}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
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
              activeFilter === filter.id && styles.activeFilterButton
            ]}
            onPress={() => handleFilterPress(filter.id)}
          >
            <Ionicons name={filter.icon} size={20} color={activeFilter === filter.id ? 'white' : 'black'} />
            <Text style={[styles.filterText, activeFilter === filter.id && styles.activeFilterText]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {autocompleteResults.length > 0 && (
        <FlatList
          data={autocompleteResults}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.autocompleteItem}
              onPress={() => {
                setSearchQuery(item.description);
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
        key="mainMap"
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
        {places.map((place, index) => (
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
        {console.log('Modal visible:', modalVisible)}
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            {selectedPlace && (
              <>
                <Text style={styles.modalTitle}>{selectedPlace.name}</Text>
                <Text style={styles.modalText}>Address: {selectedPlace.formatted_address}</Text>
                {selectedPlace.rating && (
                  <Text style={styles.modalText}>Rating: {selectedPlace.rating} / 5</Text>
                )}
                {selectedPlace.types && (
                  <Text style={styles.modalText}>Type: {selectedPlace.types.join(', ')}</Text>
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
    paddingRight: 30, // Add padding to prevent text from going under the clear button
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
    top: 90, // Adjust based on your layout
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
