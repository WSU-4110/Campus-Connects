import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, RefreshControl, AppState, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { act } from 'react-test-renderer';

export const stripHtmlTags = (html) => {
  if (typeof html !== 'string') {
    return ''; // Return an empty string if input is not a string
  }
  return html
    .replace(/<[^>]*>/g, ' ')  // Remove HTML tags
    .replace(/&nbsp;/g, ' ')   // Replace &nbsp; with space
    .replace(/&[a-z]+;/gi, ' ')  // Replace other HTML entities with space
    .replace(/\s+/g, ' ')      // Replace multiple spaces with single space
    .trim();                   // Remove leading and trailing spaces
};

const fetchEvents = async (setEvents) => {
  const url = 'https://getinvolved.wayne.edu/api/discovery/event/search';

  // Set headers for the API request
  const headers = {
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Content-Type': 'application/json',
    'Referer': 'https://getinvolved.wayne.edu/events',
  };

  // Fetch events from the API
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      throw new Error(`fetching events: ${response.statusText}`);
    }

    const data = await response.json();
    if (data && Array.isArray(data.value)) {  // Sort events by recent date
      const now = new Date();
      const sortedEvents = data.value
        .sort((a, b) => {
          const diffA = Math.abs(now - new Date(a.startsOn));    
          const diffB = Math.abs(now - new Date(b.startsOn));
          return diffA - diffB;
        })
        .slice(0, 25);
      setEvents(sortedEvents);
      
      // Conditional logging to avoid issues during tests
      if (process.env.NODE_ENV !== 'test') {
        console.log('Fetched and sorted events:', sortedEvents.length);
      }
    } else {
      console.log('No events found', data);
      setEvents([]);
    }
  } catch (error) {
    console.error('Error fetching events:', error);
  }
};

class EventDisplay {
  render() {
    throw new Error('render() must be implemented');
  }
}

class EventListDisplay extends EventDisplay {
  constructor(event, onPress) {
    super();
    this.event = event;
    this.onPress = onPress;
  }

  render() {
    return (
      <TouchableOpacity onPress={() => this.onPress(this.event)}>
        <View style={styles.eventItem}>
          <Text style={styles.eventTitle}>{this.event.name}</Text>
          <Text style={styles.eventLocation}>Location: {this.event.location}</Text>
          <Text style={styles.eventTime}>
            {new Date(this.event.startsOn) > new Date() ? 'Starts' : 'Started'}: 
            {new Date(this.event.startsOn).toLocaleString()}
          </Text>
          <Text style={styles.eventDescription} numberOfLines={3}>
            {stripHtmlTags(this.event.description)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }
}

class EventModalDisplay extends EventDisplay {
  constructor(event, onClose) {
    super();
    this.event = event;
    this.onClose = onClose;
  }

  render() {
    return (
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View>
              <Text style={styles.modalTitle}>{this.event.name}</Text>
              <Text style={styles.modalLocation}>Location: {this.event.location}</Text>
              <Text style={styles.modalTime}>
                Starts: {new Date(this.event.startsOn).toLocaleString()}
              </Text>
              <Text style={styles.modalTime}>
                Ends: {new Date(this.event.endsOn).toLocaleString()}
              </Text>
              <Text style={styles.modalDescription}>
                {stripHtmlTags(this.event.description)}
              </Text>
            </View>
          </ScrollView>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={this.onClose}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

class EventDisplayFactory {
  createDisplay() {
    throw new Error('createDisplay() must be implemented');
  }
}

class EventListFactory extends EventDisplayFactory {
  createDisplay(event, onPress) {
    return new EventListDisplay(event, onPress);
  }
}

class EventModalFactory extends EventDisplayFactory {
  createDisplay(event, onClose) {
    return new EventModalDisplay(event, onClose);
  }
}

const EventsScreen = () => {
  const navigation = useNavigation()

  // State variables
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const listFactory = new EventListFactory();
  const modalFactory = new EventModalFactory();

  const fetchEventsData = useCallback(async () => { 
    try {
      await act(async () => {
        await fetchEvents(setEvents);
      });
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      act(() => {
        setLoading(false);
        setRefreshing(false);
      });
    }
  }, []);

  useEffect(() => {
    fetchEventsData(); 

    // Listen for app state changes
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') { // If app is inactive, fetch events
        console.log('App is active');
        fetchEventsData();
      }
      appState.current = nextAppState;
      setAppStateVisible(appState.current);
    });

    return () => {
      subscription.remove();
    };
  }, [fetchEventsData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEventsData();
  }, [fetchEventsData]);

  const openEventDetails = (event) => {
    setSelectedEvent(event);
    setModalVisible(true);
  };

  const closeEventDetails = () => {
    setModalVisible(false);
    setSelectedEvent(null);
  };

  const renderEventItem = ({ item }) => {
    const eventDisplay = listFactory.createDisplay(item, openEventDetails);
    return eventDisplay.render();
  };

  const renderEventModal = () => {
    if (!selectedEvent) return null;
    const eventDisplay = modalFactory.createDisplay(selectedEvent, closeEventDetails);
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeEventDetails}
      >
        {eventDisplay.render()}
      </Modal>
    );
  };

  if (loading) { // Loading indicator
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0C5449" />
        <Text>Loading events...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.link}>Recent Events ({events.length})</Text>
        <TouchableOpacity onPress={() => navigation.navigate('PersonalEvents')}> 
          <Text style={styles.link}>My Events</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('CreateEvent')}>
          <Text style={styles.link}>Create Event</Text>
        </TouchableOpacity>
      </View>
      {events.length === 0 ? (
        <Text>No events found.</Text>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderEventItem}
          refreshControl={
            <RefreshControl
              testID="refresh-control"
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
        />
      )}
      {renderEventModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventItem: {
    marginBottom: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0C5449',
  },
  eventLocation: {
    color: 'grey',
  },
  eventTime: {
    color: 'grey',
  },
  eventDescription: {
    marginTop: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  link: {
    color: '#0C5449',
    fontSize: 16,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
    maxHeight: '80%',
  },
  modalContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingBottom: 20, 
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#0C5449',
  },
  modalLocation: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  modalTime: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  modalDescription: {
    fontSize: 16,
    marginTop: 10,
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#0C5449',
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginTop: 10, 
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
export default EventsScreen;
