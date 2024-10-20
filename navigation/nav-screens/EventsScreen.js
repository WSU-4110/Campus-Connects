import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, RefreshControl, AppState, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const fetchEvents = async () => {
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
      throw new Error(`Error fetching events: ${response.statusText}`);
    }

    const data = await response.json();
    return data; 
  } catch (error) {
    console.error('Error fetching events:', error);
    return null; 
  }
};

// Strip HTML tags from the event description
const stripHtmlTags = (html) => {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
};

const EventsScreen = () => {
  const navigation = useNavigation()

  // State variables
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);

  const fetchEventsData = useCallback(async () => { 
    try {
      const eventsData = await fetchEvents();
      if (eventsData && Array.isArray(eventsData.value)) {  // Sort events by recent date
        const now = new Date();
        const sortedEvents = eventsData.value
          .sort((a, b) => {
            const diffA = Math.abs(now - new Date(a.startsOn));    
            const diffB = Math.abs(now - new Date(b.startsOn));
            return diffA - diffB;
          })
          .slice(0, 25);
        setEvents(sortedEvents);
        console.log('Fetched and sorted events:', sortedEvents.length);
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
  }, []);

  useEffect(() => {
    fetchEventsData(); 

    // Listen for app state changes
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
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

  const onRefresh = useCallback(() => { // Refresh events
    setRefreshing(true);
    fetchEventsData();
  }, [fetchEventsData]);

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
        <FlatList  // Render events and display 
          data={events}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.eventItem}>
              <Text style={styles.eventTitle}>{item.name}</Text>
              <Text style={styles.eventLocation}>Location: {item.location}</Text>
              <Text style={styles.eventTime}>
                {new Date(item.startsOn) > new Date() ? 'Starts' : 'Started'}: {new Date(item.startsOn).toLocaleString()}
              </Text>
              <Text style={styles.eventDescription} numberOfLines={3}>
                {stripHtmlTags(item.description)}
              </Text>
            </View>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> // Pull to refresh
          }
        />
      )}
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
});

export default EventsScreen;
