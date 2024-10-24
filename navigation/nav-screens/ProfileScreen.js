import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Button, Image } from 'react-native';
import { db, auth } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

const PersonalEventsScreen = () => {
  const navigation = useNavigation();
  const [eventsData, setEventsData] = useState([]);

  // Function to fetch events from Firestore
  const fetchEvents = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'events'));
      const eventsArray = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      const userId = auth.currentUser.uid;
      const filteredEvents = eventsArray.filter(event => 
        event.isPublic || event.createdBy === userId
      );

      setEventsData(filteredEvents);
    } catch (error) {
      console.error("Error fetching events: ", error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSignOut = () => {
    auth.signOut().then(() => {
      navigation.navigate('Login'); // Navigate to your login screen after sign out
    }).catch(error => {
      console.error("Sign out error: ", error);
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Events</Text>
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={styles.link}>Sign Out</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.profileSection}>
        <Image source={{ uri: 'https://via.placeholder.com/100' }} style={styles.profileImage} />
        <Text style={styles.profileInfo}>First Name: </Text>
        <Text style={styles.profileInfo}>Last Name: </Text>
        <Text style={styles.profileInfo}>Email: </Text>
        <Text style={styles.profileInfo}>Date of Birth: </Text>
        <Text style={styles.profileInfo}>Major: </Text>
        <Text style={styles.profileInfo}>Grade Level Year: </Text>
        <Text style={styles.profileInfo}>Clubs: </Text>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('CreateEvent')}>
        <Text style={styles.link}>Create New Event</Text>
      </TouchableOpacity>

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
    backgroundColor: '#f3f4f3',
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
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  profileInfo: {
    fontSize: 16,
    marginVertical: 2,
  },
  eventCard: {
    backgroundColor: '#ffffff',
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
