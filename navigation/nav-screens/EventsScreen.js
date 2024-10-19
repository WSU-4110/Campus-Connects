import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Button } from 'react-native';
import { db, auth } from '../../firebase'; // Import Firestore and Auth
import { collection, getDocs } from 'firebase/firestore'; // Firestore functions
import CreateEventScreen from './CreateEventScreen'; // Import the new CreateEventScreen

const EventsScreen = () => {
  const [eventsData, setEventsData] = useState([]); // To store events from Firestore
  const [isCreatingEvent, setIsCreatingEvent] = useState(false); // To toggle event creation form

  // Function to fetch events from Firestore
  const fetchEvents = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'events'));
      const eventsArray = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Get the current user's ID
      const userId = auth.currentUser.uid;

      // Filter events to show only public events and private events created by the current user
      const filteredEvents = eventsArray.filter(event => 
        event.isPublic || event.createdBy === userId
      );

      setEventsData(filteredEvents);
    } catch (error) {
      console.error("Error fetching events: ", error);
    }
  };

  // Call fetchEvents when the component mounts
  useEffect(() => {
    fetchEvents();
  }, []);

  // Function to refresh events after creating a new one
  const handleEventCreated = () => {
    fetchEvents();
    setIsCreatingEvent(false); // Hide the create event form after creation
  };

  return (
    <View style={styles.container}>
      <Button title="Create New Event" onPress={() => setIsCreatingEvent(true)} />
      
      {isCreatingEvent ? (
        <CreateEventScreen onEventCreated={handleEventCreated} />
      ) : (
        <FlatList
          data={eventsData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.eventCard}>
              <Text style={styles.eventTitle}>{item.title}</Text>
              <Text style={styles.eventDate}>{item.date}</Text>
              <Text style={styles.eventDescription}>{item.description}</Text>
              <Text>{item.isPublic ? "Public" : "Private"}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

export default EventsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f3f4f3',//background color for events page
  },
  eventCard: {
    backgroundColor: '#ffffff', //color of the events cards,
    padding: 15,
    marginBottom: 10,
    borderRadius: 5,
    elevation: 3,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  eventDate: {
    fontSize: 14,
    color: '#888',
  },
  eventDescription: {
    fontSize: 14,
    color: '#333',
  },
});
