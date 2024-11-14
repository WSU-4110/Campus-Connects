import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, RefreshControl, AppState, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import { db, auth } from '../../firebase'; 
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc, collection } from 'firebase/firestore';

// Function to fetch events from the API
const fetchEvents = async () => {
  const url = 'https://getinvolved.wayne.edu/api/discovery/event/search';
  const headers = {
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Content-Type': 'application/json',
    'Referer': 'https://getinvolved.wayne.edu/events',
  };

  try {
    const response = await fetch(url, { method: 'GET', headers });
    if (!response.ok) {
      throw new Error(`Error fetching events: ${response.statusText}`);
    }
    const data = await response.json();
    return data; 
  } catch (error) {
    console.error('Error fetching events:', error);
    return null; 
  }
};

// Strip HTML from the event description, adjust spacing 
const stripHtmlTags = (html) => {
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

const EventsScreen = () => {
  const navigation = useNavigation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [userBookmarks, setUserBookmarks] = useState([]); 

  // Fetch user bookmarks
  const fetchUserBookmarks = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      setUserBookmarks(userSnap.data().bookmarks || []);
    } else {
      setUserBookmarks([]);
    }
  };

  // Store events in Firestore
  const storeEventsInFirestore = async (eventsData) => {
    const eventsCollection = collection(db, 'wsuevents');

    for (const event of eventsData) {
      const eventRef = doc(eventsCollection, event.id); 
      await setDoc(eventRef, {
        name: event.name,
        location: event.location, 
        startsOn: event.startsOn, 
        endsOn: event.endsOn, 
        description: event.description, 
      }, { merge: true }); 
    }
  };

  // Fetch events data
  const fetchEventsData = useCallback(async () => { 
    try {
      const eventsData = await fetchEvents();
      if (eventsData && Array.isArray(eventsData.value)) {
        await storeEventsInFirestore(eventsData.value); 
        const now = new Date();
        const sortedEvents = eventsData.value
          .sort((a, b) => {
            const diffA = Math.abs(now - new Date(a.startsOn));    
            const diffB = Math.abs(now - new Date(b.startsOn));
            return diffA - diffB;
          })
          .slice(0, 25);
        
        // Set bookmark status for each event
        const eventsWithBookmarks = sortedEvents.map(event => ({
          ...event,
          isBookmarked: userBookmarks.includes(event.id), 
        }));

        setEvents(eventsWithBookmarks);
        console.log('Fetched and sorted events:', eventsWithBookmarks.length);
      } else {
        console.log('No events found', eventsData);
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userBookmarks]);

  // Toggle bookmark status
  const toggleBookmark = async (eventId, isBookmarked) => {
    try {
      const userId = auth.currentUser?.uid; 
      if (!userId) {
        console.error("User is not authenticated");
        return; 
      }

      const userRef = doc(db, 'users', userId); 

      await updateDoc(userRef, { bookmarks: isBookmarked ? arrayRemove(eventId) : arrayUnion(eventId) });
      
      setUserBookmarks(prev => isBookmarked ? prev.filter(id => id !== eventId) : [...prev, eventId]);
      
      fetchEventsData(); 
    } catch (error) {
      console.error("Error updating bookmark: ", error); 
      Alert.alert("Failed to update bookmark");
    }
  };

  useEffect(() => {
    fetchUserBookmarks().then(fetchEventsData);
  }, []);

  // Listen for app state changes
  useEffect(() => {
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
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => openEventDetails(item)}> 
              <View style={styles.eventItem}>
                <Text style={styles.eventTitle}>{item.name}</Text>
                <Text style={styles.eventLocation}>Location: {item.location}</Text>
                <Text style={styles.eventTime}>
                  {new Date(item.startsOn) > new Date() ? 'Starts' : 'Started'}: {new Date(item.startsOn).toLocaleString()}
                </Text>
                <Text style={styles.eventDescription} numberOfLines={3}>
                  {stripHtmlTags(item.description)}
                </Text>
                <View style={styles.bookmarkContainer}>
                <TouchableOpacity onPress={() => toggleBookmark(item.id, item.isBookmarked)}>
                  <FontAwesome 
                    name={item.isBookmarked ? "bookmark" : "bookmark-o"} 
                    size={24} 
                    color={item.isBookmarked ? "#0C5449" : "grey"} 
                  />
                
                </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Modal for event details */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeEventDetails}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              {selectedEvent && (
                <View>
                  <Text style={styles.modalTitle}>{selectedEvent.name}</Text>
                  <Text style={styles.modalLocation}>Location: {selectedEvent.location}</Text>
                  <Text style={styles.modalTime}>
                    Starts: {new Date(selectedEvent.startsOn).toLocaleString()}
                  </Text>
                  <Text style={styles.modalTime}>
                    Ends: {new Date(selectedEvent.endsOn).toLocaleString()}
                  </Text>
                  <Text style={styles.modalDescription}>
                    {stripHtmlTags(selectedEvent.description)}
                  </Text>
                </View>
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeEventDetails}
            >
              <Text style={styles.closeButtonText}>Close</Text>
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
  bookmarkContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
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
  bookmarkText: {
    color: '#0C5449',
    marginTop: 5,
    fontWeight: 'bold',
  },
});

export default EventsScreen;
