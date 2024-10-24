import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { db, auth } from '../../firebase'; // Import Firestore and Auth
import { collection, getDocs } from 'firebase/firestore'; // Firestore functions
import { useNavigation } from '@react-navigation/native';

const PersonalEventsScreen = () => {
  const navigation = useNavigation();
  const [eventsData, setEventsData] = useState([]); // To store events from Firestore
  const [modalVisible, setModalVisible] = useState(false); // Modal visibility state
  const [selectedEvent, setSelectedEvent] = useState(null); // Selected event for modal

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

  // Function to open the modal with selected event details
  const openEventDetails = (event) => {
    setSelectedEvent(event);
    setModalVisible(true);
  };

  // Function to close the modal
  const closeEventDetails = () => {
    setModalVisible(false);
    setSelectedEvent(null);
  };

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
          <TouchableOpacity style={styles.eventCard} onPress={() => openEventDetails(item)}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <Text style={styles.eventLocation}>Location: {item.location}</Text>
            <Text style={styles.eventDate}>Date: {item.date}</Text>
            <Text style={styles.eventTime}>Starts: {item.startTime} - Ends: {item.endTime}</Text>
            <Text style={styles.eventDescription} numberOfLines={3}>{item.description}</Text>
            <Text style={styles.eventsStatus}>{item.isPublic ? "Public" : "Private"}</Text>
          </TouchableOpacity>
        )}
      />

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
                  <Text style={styles.modalTitle}>{selectedEvent.title}</Text>
                  <Text style={styles.modalLocation}>Location: {selectedEvent.location}</Text>
                  <Text style={styles.modalDate}>Starts: {selectedEvent.date}, {selectedEvent.time}</Text>
                  <Text style={styles.modalDescription}>{selectedEvent.description}</Text>
                  <Text>{selectedEvent.isPublic ? "Public" : "Private"}</Text>
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
    backgroundColor: '#fff', // background color for events page
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
    color: '#0C5449',
  },
  link: {
    color: '#0C5449',
    fontSize: 16,
  },
  eventCard: {
    backgroundColor: '#fff', // color of the events cards
    padding: 15,
    marginBottom: 10,
    elevation: 3,
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
    fontSize: 14,
    color: '#888',
  },
  eventDate: {
    fontSize: 14,
    color: '#888',
  },
  eventTime: {
    fontSize: 14,
    color: '#888',
  },
  eventDescription: {
    fontSize: 14,
    color: '#333',
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
  modalDate: {
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
      height: 2,
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
});

export default PersonalEventsScreen;
