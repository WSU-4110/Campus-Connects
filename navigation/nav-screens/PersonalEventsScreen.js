import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Button } from 'react-native';
import { db, auth } from '../../firebase'; // Import Firestore and Auth
import { collection, getDocs } from 'firebase/firestore'; // Firestore functions
import { useNavigation } from '@react-navigation/native';

const PersonalEventsScreen = () => {
  const navigation = useNavigation();
  const [eventsData, setEventsData] = useState([]); // To store events from Firestore

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Events</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreateEvent')}>
          <Text style={styles.link}>Create New Event</Text>
        </TouchableOpacity>
      </View>
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
    </View>
  );
};

export default PersonalEventsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f3f4f3',//background color for events page
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  link: {
    color: '#0C5449',
    fontSize: 16,
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
