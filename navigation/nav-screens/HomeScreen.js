import React, { Component } from 'react';
import { StyleSheet, View, TextInput, Alert, Modal, Text, TouchableOpacity, FlatList, Dimensions, Linking, Platform } from 'react-native';
import MapView, { Marker, Polygon, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const GOOGLE_MAPS_API_KEY = 'AIzaSyDErTBfHz5vRT8AafrF1B5PgErR8MKJAsk';

// Keep the WSU_BOUNDARIES and other constants outside the class
const WSU_BOUNDARIES = [
  { latitude: 42.364250, longitude: -83.080500 },
  { latitude: 42.364250, longitude: -83.058500 },
  { latitude: 42.348750, longitude: -83.058500 },
  { latitude: 42.348750, longitude: -83.080500 },
];

class HomeScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchQuery: '',
      region: {
        latitude: 42.357341,
        longitude: -83.069711,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      places: [],
      selectedPlace: null,
      modalVisible: false,
      autocompleteResults: [],
      activeFilter: null,
      location: null,
      errorMsg: null,
      route: null,
      routeSteps: [],
      showDirections: false,
      routeMarkers: [],
    };
    this.mapRef = React.createRef();
  }

  // Method 1: Location Management
  async handleLocationPermission() {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        this.setState({ errorMsg: 'Permission to access location was denied' });
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
      this.setState({ location: currentLocation });

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 5,
          mayShowUserSettingsDialog: true,
        },
        (newLocation) => {
          if (newLocation.coords.accuracy <= 20) {
            this.setState(prevState => ({
              location: prevState.location ? {
                ...newLocation,
                coords: {
                  ...newLocation.coords,
                  latitude: (prevState.location.coords.latitude + newLocation.coords.latitude) / 2,
                  longitude: (prevState.location.coords.longitude + newLocation.coords.longitude) / 2,
                }
              } : newLocation
            }));
          }
        }
      );
      return subscription;
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get location');
    }
  }

  // Method 2: Search Management
  async handleSearch(placeId = null) {
    if (placeId) {
      const placeDetails = await this.fetchPlaceDetails(placeId);
      if (placeDetails) {
        this.setState({
          selectedPlace: placeDetails,
          modalVisible: true,
          region: {
            ...this.state.region,
            latitude: placeDetails.geometry.location.lat,
            longitude: placeDetails.geometry.location.lng,
          },
          places: [placeDetails],
        });
      }
    } else {
      this.fetchPlaces(this.state.searchQuery, this.state.activeFilter);
    }
    this.setState({ autocompleteResults: [] });
  }

  // Method 3: Navigation Management
  async handleNavigation(destination) {
    if (!this.state.location) {
      Alert.alert('Error', 'Your current location is not available');
      return;
    }

    const { latitude: startLat, longitude: startLng } = this.state.location.coords;
    const { latitude: destLat, longitude: destLng } = destination;

    await this.fetchDirections(startLat, startLng, destLat, destLng);
  }

  // Method 4: Place Management
  async fetchPlaces(query = '', filterType = null) {
    try {
      let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${this.state.region.latitude},${this.state.region.longitude}&radius=2000&key=${GOOGLE_MAPS_API_KEY}`;
      
      if (filterType) {
        url += `&type=${filterType}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        const filteredPlaces = data.results.filter(place => 
          this.isPointInPolygon({
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng
          }, WSU_BOUNDARIES)
        );
        this.setState({
          places: filteredPlaces,
          selectedPlace: filteredPlaces[0],
          modalVisible: filteredPlaces.length > 0
        });
        if (filteredPlaces.length === 0) {
          Alert.alert('No Results', 'No places found for the selected filter in this area.');
        }
      }
    } catch (error) {
      console.error('Error fetching places:', error);
      Alert.alert('Error', 'Failed to fetch places');
    }
  }

  // Method 5: Route Management
  async fetchDirections(startLat, startLng, destLat, destLng) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${startLat},${startLng}&destination=${destLat},${destLng}&mode=walking&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.status === 'OK' && data.routes.length > 0) {
        const points = this.decodePolyline(data.routes[0].overview_polyline.points);
        const markers = this.createRouteMarkers(data.routes[0].legs[0].steps);
        
        this.setState({
          route: points,
          routeSteps: data.routes[0].legs[0].steps,
          showDirections: true,
          routeMarkers: markers
        });

        const coordinates = points.map(point => ({
          latitude: point.latitude,
          longitude: point.longitude,
        }));
        
        this.mapRef.current?.fitToCoordinates(coordinates, {
          edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
          animated: true,
        });
      }
    } catch (error) {
      console.error('Error fetching directions:', error);
      Alert.alert('Error', 'Failed to fetch directions');
    }
  }

  // Method 6: Filter Management
  handleFilterPress(filterId) {
    this.setState(prevState => ({
      activeFilter: prevState.activeFilter === filterId ? null : filterId
    }), () => {
      this.fetchPlaces('', this.state.activeFilter === filterId ? null : filterId);
    });
  }

  // Helper Methods
  isPointInPolygon(point, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].latitude, yi = polygon[i].longitude;
      const xj = polygon[j].latitude, yj = polygon[j].longitude;
      const intersect = ((yi > point.longitude) !== (yj > point.longitude))
        && (point.latitude < (xj - xi) * (point.longitude - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  decodePolyline(encoded) {
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
  }

  createRouteMarkers(steps) {
    return steps.map((step, index) => ({
      coordinate: {
        latitude: step.start_location.lat,
        longitude: step.start_location.lng
      },
      distance: step.distance.text,
      instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
      id: index.toString()
    }));
  }

  async fetchPlaceDetails(placeId) {
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
  }

  clearRoute = () => {
    this.setState({
      route: null,
      routeSteps: [],
      showDirections: false,
      routeMarkers: []
    });
  }

  componentDidMount() {
    this.handleLocationPermission();
  }

  render() {
    const FILTER_OPTIONS = [
      { id: 'restaurant', label: 'Restaurants', icon: 'restaurant' },
      { id: 'school', label: 'Academic', icon: 'school' },
      { id: 'parking', label: 'Parking', icon: 'car' },
      { id: 'tourist_attraction', label: 'Attractions', icon: 'camera' },
    ];

    return (
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="gray" style={styles.searchIcon} />
          <TextInput
            style={styles.searchBar}
            placeholder="Search buildings or businesses..."
            value={this.state.searchQuery}
            onChangeText={(text) => this.setState({ searchQuery: text })}
            onSubmitEditing={() => this.handleSearch()}
            returnKeyType="search"
          />
          {this.state.searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => this.setState({ searchQuery: '', autocompleteResults: [] })} 
              style={styles.clearButton}
            >
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
                this.state.activeFilter === filter.id && styles.activeFilterButton
              ]}
              onPress={() => this.handleFilterPress(filter.id)}
            >
              <Ionicons 
                name={filter.icon} 
                size={20} 
                color={this.state.activeFilter === filter.id ? 'white' : 'black'} 
              />
              <Text style={[
                styles.filterText, 
                this.state.activeFilter === filter.id && styles.activeFilterText
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <MapView
          ref={this.mapRef}
          style={styles.map}
          initialRegion={this.state.region}
          onRegionChangeComplete={(region) => this.setState({ region })}
          minZoomLevel={14}
          maxZoomLevel={18}
          showsUserLocation={true}
          followsUserLocation={true}
          showsMyLocationButton={true}
        >
          <Polygon
            coordinates={WSU_BOUNDARIES}
            fillColor="rgba(0, 0, 255, 0.1)"
            strokeColor="rgba(0, 0, 255, 0.3)"
            strokeWidth={2}
          />
          {this.state.places.map((place, index) => (
            <Marker
              key={index}
              coordinate={{
                latitude: place.geometry.location.lat,
                longitude: place.geometry.location.lng,
              }}
              title={place.name}
              description={place.formatted_address}
              onPress={() => this.setState({ selectedPlace: place, modalVisible: true })}
            />
          ))}
          {this.state.route && (
            <>
              {this.state.routeSteps.map((step, index) => {
                if (index < this.state.routeSteps.length - 1) {
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
              {this.state.routeMarkers.map((marker) => (
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
        </MapView>

        {this.state.showDirections && (
          <View style={styles.directionsPanel}>
            <View style={styles.directionsHeader}>
              <Text style={styles.directionsTitle}>Directions</Text>
              <TouchableOpacity onPress={this.clearRoute}>
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={this.state.routeSteps}
              renderItem={({ item }) => (
                <View style={styles.directionStep}>
                  <Text>{item.html_instructions.replace(/<[^>]*>/g, '')}</Text>
                  <Text style={styles.distanceText}>{item.distance.text}</Text>
                </View>
              )}
              keyExtractor={(item, index) => index.toString()}
            />
          </View>
        )}

        <Modal
          animationType="slide"
          transparent={true}
          visible={this.state.modalVisible}
          onRequestClose={() => this.setState({ modalVisible: false })}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              {this.state.selectedPlace && (
                <>
                  <Text style={styles.modalTitle}>{this.state.selectedPlace.name}</Text>
                  <Text style={styles.modalText}>
                    Address: {this.state.selectedPlace.formatted_address}
                  </Text>
                  {this.state.selectedPlace.rating && (
                    <Text style={styles.modalText}>
                      Rating: {this.state.selectedPlace.rating} / 5
                    </Text>
                  )}
                  <TouchableOpacity
                    style={styles.navigationButton}
                    onPress={() => this.handleNavigation({
                      latitude: this.state.selectedPlace.geometry.location.lat,
                      longitude: this.state.selectedPlace.geometry.location.lng
                    })}
                  >
                    <Ionicons name="navigate" size={20} color="white" />
                    <Text style={styles.navigationButtonText}>Navigate Here</Text>
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => this.setState({ modalVisible: false })}
              >
                <Text style={styles.textStyle}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }
}

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
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22
  },
});

export default HomeScreen;
