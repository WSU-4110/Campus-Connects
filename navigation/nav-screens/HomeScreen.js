import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TextInput, Alert, Modal, Text, TouchableOpacity, FlatList, Dimensions, Linking, Platform } from 'react-native';
import MapView, { Marker, Polygon, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

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
  // { id: 'tourist_attraction', label: 'Attractions', icon: 'camera' },
];

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;

const WSU_REGION = {
  latitude: (WSU_BOUNDARIES[0].latitude + WSU_BOUNDARIES[2].latitude) / 2,
  longitude: (WSU_BOUNDARIES[0].longitude + WSU_BOUNDARIES[1].longitude) / 2,
  latitudeDelta: Math.abs(WSU_BOUNDARIES[0].latitude - WSU_BOUNDARIES[2].latitude) * 1.5,
  longitudeDelta: Math.abs(WSU_BOUNDARIES[0].longitude - WSU_BOUNDARIES[1].longitude) * 1.5 * ASPECT_RATIO,
};

const WSU_BUILDINGS = [
  {
    name: "State Hall",
    location: { lat: 42.355639, lng: -83.067833 },
    type: "Academic"
  },
  {
    name: "Undergraduate Library",
    location: { lat: 42.356972, lng: -83.070833 },
    type: "Academic"
  },
  {
    name: "Student Center",
    location: { lat: 42.355833, lng: -83.069833 },
    type: "Academic"
  },
  {
    name: "Manoogian Hall",
    location: { lat: 42.356833, lng: -83.068639 },
    type: "Academic"
  },
  {
    name: "Engineering Building",
    location: { lat: 42.358056, lng: -83.069944 },
    type: "Academic"
  },
  {
    name: "Science Hall",
    location: { lat: 42.356389, lng: -83.069556 },
    type: "Academic"
  },
  {
    name: "Law School",
    location: { lat: 42.356639, lng: -83.068778 },
    type: "Academic"
  }
];

const WSU_PARKING = [
  {
    name: "Structure 1",
    location: { lat: 42.355750, lng: -83.066361 },
    type: "Parking",
    description: "Palmer Structure"
  },
  {
    name: "Structure 2",
    location: { lat: 42.357222, lng: -83.069833 },
    type: "Parking",
    description: "Manoogian Structure"
  },
  {
    name: "Structure 3",
    location: { lat: 42.354972, lng: -83.069722 },
    type: "Parking",
    description: "Parking Structure 3"
  },
  {
    name: "Structure 4",
    location: { lat: 42.356889, lng: -83.071833 },
    type: "Parking",
    description: "Anthony Wayne Drive Structure"
  },
  {
    name: "Structure 5",
    location: { lat: 42.358556, lng: -83.070722 },
    type: "Parking",
    description: "Engineering Structure"
  },
  {
    name: "Structure 6",
    location: { lat: 42.360278, lng: -83.074778 },
    type: "Parking",
    description: "Medical School Structure"
  },
  {
    name: "Structure 7",
    location: { lat: 42.353889, lng: -83.060833 },
    type: "Parking",
    description: "John R Structure"
  },
  {
    name: "Structure 8",
    location: { lat: 42.356944, lng: -83.075278 },
    type: "Parking",
    description: "Lodge Service Drive Structure"
  }
];

const HomeScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [autocompleteResults, setAutocompleteResults] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null);
  const mapRef = useRef(null);
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [locationSubscription, setLocationSubscription] = useState(null);
  const [route, setRoute] = useState(null);
  const [routeSteps, setRouteSteps] = useState([]);
  const [showDirections, setShowDirections] = useState(false);
  const [routeMarkers, setRouteMarkers] = useState([]);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [eventLocations, setEventLocations] = useState([]);
  const [eventsModalVisible, setEventsModalVisible] = useState(false);

  const ACCURACY_THRESHOLD = 20; // meters

  const fetchAutocomplete = async (input) => {
    try {
      if (!location || !location.coords) {
        console.log('Location not available yet');
        return;
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&location=${location.coords.latitude},${location.coords.longitude}&radius=2000&key=${GOOGLE_MAPS_API_KEY}`
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
      let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${location.coords.latitude},${location.coords.longitude}&radius=2000&key=${GOOGLE_MAPS_API_KEY}`;
      
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

  const fetchEvents = async () => {
    try {
      const eventsCollection = collection(db, 'events');
      const eventSnapshot = await getDocs(eventsCollection);
      const eventsList = eventSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Fetched events:', eventsList);
      setEventLocations(eventsList);
      console.log('Event locations state set:', eventsList.length, 'events');
    } catch (error) {
      console.error('Error fetching events:', error);
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

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        Alert.alert(
          "Location Access Denied",
          "Please enable location services to use this feature"
        );
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        maximumAge: 10000,
      });

      setLocation(currentLocation);

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (newLocation) => {
          if (newLocation.coords.accuracy <= ACCURACY_THRESHOLD) {
            setLocation(newLocation);
          }
        }
      );

      setLocationSubscription(subscription);

      return () => {
        if (locationSubscription) {
          locationSubscription.remove();
        }
      };
    })();
  }, []);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = async (placeId = null) => {
    if (placeId) {
      const placeDetails = await fetchPlaceDetails(placeId);
      if (placeDetails) {
        setSelectedPlace(placeDetails);
        setModalVisible(true);
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
    
    if (filterId === 'school') {
      // Show Wayne State buildings
      const academicBuildings = WSU_BUILDINGS.map(building => ({
        geometry: {
          location: {
            lat: building.location.lat,
            lng: building.location.lng
          }
        },
        name: building.name,
        formatted_address: "Wayne State University",
        types: [building.type]
      }));
      
      setPlaces(academicBuildings);
      setModalVisible(false);
    } else if (filterId === 'parking') {
      // Show Wayne State parking structures
      const parkingStructures = WSU_PARKING.map(parking => ({
        geometry: {
          location: {
            lat: parking.location.lat,
            lng: parking.location.lng
          }
        },
        name: parking.name,
        formatted_address: parking.description,
        types: [parking.type]
      }));
      
      setPlaces(parkingStructures);
      setModalVisible(false);
    } else {
      // Original behavior for other filters
      fetchPlaces('', activeFilter === filterId ? null : filterId);
    }
  };

  const fetchDirections = async (startLat, startLng, destLat, destLng) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${startLat},${startLng}&destination=${destLat},${destLng}&mode=walking&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.status === 'OK' && data.routes.length > 0) {
        const points = decodePolyline(data.routes[0].overview_polyline.points);
        
        if (!points || points.length === 0) {
          Alert.alert('Error', 'Could not calculate route');
          return;
        }

        setRoute(points);
        setRouteSteps(data.routes[0].legs[0].steps);
        setShowDirections(true);
        
        const markers = createRouteMarkers(data.routes[0].legs[0].steps);
        setRouteMarkers(markers);

        // Set specific zoom level and center on current location
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: startLat,
            longitude: startLng,
            latitudeDelta: 0.02,  // This approximates zoom level 14
            longitudeDelta: 0.02,
          }, 500);  // 500ms animation duration
        }
      } else {
        Alert.alert('Error', 'Could not find a route to this location');
      }
    } catch (error) {
      console.error('Error fetching directions:', error);
      Alert.alert('Error', 'Failed to fetch directions');
    }
  };

  const decodePolyline = (encoded) => {
    const points = [];
    let index = 0, lat = 0, lng = 0;

    while (index < encoded.length) {
      let shift = 0, result = 0;
      
      do {
        let byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (result & 0x20);
      
      lat += ((result & 1) ? ~(result >> 1) : (result >> 1));
      
      shift = 0;
      result = 0;
      
      do {
        let byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (result & 0x20);
      
      lng += ((result & 1) ? ~(result >> 1) : (result >> 1));
      
      points.push({
        latitude: lat * 1e-5,
        longitude: lng * 1e-5,
      });
    }
    
    return points;
  };

  const createRouteMarkers = (steps) => {
    return steps.map((step, index) => ({
      coordinate: {
        latitude: step.start_location.lat,
        longitude: step.start_location.lng
      },
      distance: step.distance.text,
      instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
      id: index.toString()
    }));
  };

  const handleNavigation = (destination) => {
    if (!location) {
      Alert.alert('Error', 'Your current location is not available');
      return;
    }

    const { latitude: startLat, longitude: startLng } = location.coords;
    const { latitude: destLat, longitude: destLng } = destination;

    fetchDirections(startLat, startLng, destLat, destLng);
  };

  const clearRoute = () => {
    setRoute(null);
    setRouteSteps([]);
    setShowDirections(false);
    setRouteMarkers([]);
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
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 42.357341,
          longitude: -83.069711,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        followsUserLocation={false}
        showsMyLocationButton={true}
        onPanDrag={() => setIsFollowingUser(false)}
        onPress={() => setIsFollowingUser(false)}
        showsCompass={true}
        compassStyle={{
          top: 130,  // 80 (filter buttons) + some padding
          right: 10,
        }}
      >
        <Polygon
          coordinates={WSU_BOUNDARIES}
          fillColor="rgba(0, 0, 255, 0)"
          strokeColor="rgba(12, 84, 73, 0.3)"
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
        {location && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="You are here"
            description="Your current location"
          />
        )}
        {route && (
          <>
            {routeSteps.map((step, index) => {
              if (index < routeSteps.length - 1) {
                return (
                  <Polyline
                    key={`line-${index}`}
                    coordinates={[
                      {
                        latitude: step.start_location.lat,
                        longitude: step.start_location.lng
                      },
                      {
                        latitude: step.end_location.lat,
                        longitude: step.end_location.lng
                      }
                    ]}
                    strokeWidth={4}
                    strokeColor="#2196F3"
                  />
                );
              }
            })}
            {routeMarkers.map((marker) => (
              <Marker
                key={marker.id}
                coordinate={marker.coordinate}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={styles.markerLabel}>
                  <Text style={styles.markerText}>{marker.distance}</Text>
                </View>
              </Marker>
            ))}
          </>
        )}
        {eventLocations.map((event) => {
          console.log('Processing event:', event);
          if (!event?.title || !event?.location) {
            console.log('Skipping invalid event:', event);
            return null;
          }
          
          let coordinates = null;
          const locationKey = event.location.toLowerCase().trim();
          console.log('Looking for location:', locationKey);
          
          // Check WSU_BUILDINGS first
          const academicBuilding = WSU_BUILDINGS.find(building => 
            building.name.toLowerCase().includes(locationKey) ||
            locationKey.includes(building.name.toLowerCase())
          );
          if (academicBuilding) {
            console.log('Found matching academic building:', academicBuilding.name);
            console.log('Setting coordinates to:', academicBuilding.location);
            coordinates = {
              latitude: academicBuilding.location.lat,
              longitude: academicBuilding.location.lng
            };
          }
          
          // Check WSU_PARKING if not found in buildings
          if (!coordinates) {
            const parkingStructure = WSU_PARKING.find(parking => 
              parking.name.toLowerCase().includes(locationKey) ||
              locationKey.includes(parking.name.toLowerCase()) ||
              locationKey.includes(parking.description.toLowerCase())
            );
            if (parkingStructure) {
              console.log('Found matching parking structure for:', event.title);
              coordinates = {
                latitude: parkingStructure.location.lat,
                longitude: parkingStructure.location.lng
              };
            }
          }
          
          // If no match found, use default WSU coordinates
          if (!coordinates) {
            console.log('No matching location found for:', event.title, 'Using default coordinates');
            coordinates = {
              latitude: 42.357341,
              longitude: -83.069711
            };
          }

          console.log('Creating marker with coordinates:', coordinates);
          return (
            <Marker
              key={event.id}
              coordinate={coordinates}
              pinColor="#0C5449"
              onPress={() => {
                setSelectedPlace({
                  name: event.title,
                  formatted_address: event.location,
                  date: `${event.date || 'TBD'} at ${event.startTime || 'TBD'}`,
                  description: (
                    <Text>
                      {`Time: ${event.startTime || 'TBD'} - ${event.endTime || 'TBD'}
Location: ${event.location}
Attendees: ${Array.isArray(event.attendees) ? event.attendees.length : 0} people going

${event.description || ''}

Tags: ${event.tags?.join(', ') || 'None'}
${event.isPublic ? '🌐 Public Event' : '🔒 Private Event'}`}
                    </Text>
                  ),
                  geometry: {
                    location: {
                      lat: coordinates.latitude,
                      lng: coordinates.longitude
                    }
                  }
                });
                setModalVisible(true);
              }}
            >
              <View style={styles.eventMarker}>
                <Ionicons name="calendar" size={24} color="#0C5449" />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {showDirections && (
        <View style={styles.directionsPanel}>
          <View style={styles.directionsHeader}>
            <Text style={styles.directionsTitle}>Directions</Text>
            <TouchableOpacity onPress={clearRoute}>
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={routeSteps}
            renderItem={({ item }) => (
              <View style={styles.directionStep}>
                <Text>{item.html_instructions.replace(/<[^>]*>/g, '')}</Text>
                <Text style={styles.distanceText}>
                  {item.distance.text}
                </Text>
              </View>
            )}
            keyExtractor={(item, index) => index.toString()}
          />
        </View>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            {selectedPlace && (
              <>
                <Text style={styles.modalTitle}>{selectedPlace.name}</Text>
                {selectedPlace.date && (
                  <Text style={styles.modalDate}>{selectedPlace.date}</Text>
                )}
                {selectedPlace.description && (
                  <Text style={[styles.modalText, styles.descriptionText]}>
                    {selectedPlace.description}
                  </Text>
                )}
                <TouchableOpacity
                  style={styles.navigationButton}
                  onPress={() => handleNavigation({
                    latitude: selectedPlace.geometry.location.lat,
                    longitude: selectedPlace.geometry.location.lng
                  })}
                >
                  <Ionicons name="navigate" size={20} color="white" />
                  <Text style={styles.navigationButtonText}>Navigate Here</Text>
                </TouchableOpacity>
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
    top: 80,
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
    backgroundColor: "#0C5449",
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
    top: 70,
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
    top: 140,
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
    backgroundColor: '#0C5449',
  },
  filterText: {
    marginLeft: 5,
    fontSize: 12,
  },
  activeFilterText: {
    color: 'white',
  },
  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 20,
    marginTop: 10,
    marginBottom: 15,
  },
  navigationButtonText: {
    color: 'white',
    marginLeft: 10,
    fontWeight: 'bold',
  },
  directionsPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    maxHeight: '40%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  directionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  directionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  directionStep: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  distanceText: {
    color: '#666',
    fontSize: 12,
    marginTop: 5,
  },
  markerLabel: {
    backgroundColor: 'white',
    padding: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  markerText: {
    fontSize: 10,
    color: '#2196F3',
  },
  eventMarker: {
    backgroundColor: 'white',
    padding: 5,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0C5449',
  },
  modalDate: {
    fontSize: 16,
    color: '#0C5449',
    marginBottom: 10,
    fontWeight: 'bold',
  },
});

export default HomeScreen;

