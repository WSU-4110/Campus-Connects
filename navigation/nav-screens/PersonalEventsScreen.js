import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import { db, auth } from '../../firebase';
import { collection, getDocs, doc, deleteDoc, updateDoc, arrayUnion, arrayRemove, setDoc, getDoc } from 'firebase/firestore';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';

const PersonalEventsScreen = () => {
  const navigation = useNavigation();
  const [eventsData, setEventsData] = useState([]);
  const [userBookmarks, setUserBookmarks] = useState([]); // To track user bookmarks
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

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

  // Fetch events from Firestore
  const fetchEvents = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'events'));
      const eventsArray = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isBookmarked: userBookmarks.includes(doc.id), // Set initial bookmark status
      }));
      const userId = auth.currentUser?.uid;

      // Filter events: show public events or events created by the current user
      const filteredEvents = eventsArray.filter(event =>
        event.isPublic || event.createdBy === userId
      );
      setEventsData(filteredEvents);
    } catch (error) {
      console.error("Error fetching events: ", error);
    }
  };

  const toggleBookmark = async (eventId, isBookmarked) => {
    try {
      const userId = auth.currentUser?.uid;
      const userRef = doc(db, 'users', userId);

      // Use setDoc to ensure the document exists
      await setDoc(userRef, {}, { merge: true });

      if (isBookmarked) {
        await updateDoc(userRef, { bookmarks: arrayRemove(eventId) });
        setUserBookmarks(prev => prev.filter(id => id !== eventId));
      } else {
        await updateDoc(userRef, { bookmarks: arrayUnion(eventId) });
        setUserBookmarks(prev => [...prev, eventId]);
      }

      fetchEvents(); // Refresh the event list
    } catch (error) {
      console.error("Error updating bookmark: ", error);
      Alert.alert("Failed to update bookmark");
    }
  };

  // Fetch events and bookmarks whenever the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchUserBookmarks().then(fetchEvents);
    }, [userBookmarks])
  );

  // Handle opening event details in a modal
  const openEventDetails = (event) => {
    setSelectedEvent(event);
    setModalVisible(true);
  };

  // Close the modal
  const closeEventDetails = () => {
    setModalVisible(false);
    setSelectedEvent(null);
  };

  // Handle deleting an event
  const handleDeleteEvent = async () => {
    if (selectedEvent) {
      const user = auth.currentUser;
      // Ensure the current user is the creator of the event
      if (selectedEvent.createdBy !== user.uid) {
        Alert.alert("You are not authorized to delete this event.");
        return;
      }

      try {
        await deleteDoc(doc(db, 'events', selectedEvent.id)); // Delete the event from Firestore
        Alert.alert("Event deleted successfully!");
        fetchEvents(); // Refresh the events list after deletion
        closeEventDetails(); // Close the modal
      } catch (error) {
        console.error("Error deleting event: ", error);
        Alert.alert("Failed to delete event");
      }
    }
  };
  

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Events</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreateEvent')}>
          <Text style={styles.link}>Create New Event</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={eventsData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          
          <TouchableOpacity style={styles.eventCard} onPress={() => openEventDetails(item)}>
             <View style={styles.bookmarkContainer}>
            <TouchableOpacity onPress={() => toggleBookmark(item.id, item.isBookmarked)}>
              <FontAwesome 
                name={item.isBookmarked ? "bookmark" : "bookmark-o"} 
                size={24} 
                color={item.isBookmarked ? "#0C5449" : "grey"} 
              />
            </TouchableOpacity>
            </View>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <Text style={styles.eventLocation}>Location: {item.location || 'N/A'}</Text>
            <Text style={styles.eventDate}>Date: {item.date || 'N/A'}</Text>
            <Text style={styles.eventTime}>Starts: {item.startTime || 'N/A'} - Ends: {item.endTime || 'N/A'}</Text>
            <Text style={styles.eventDescription} numberOfLines={3}>{item.description}</Text>
            <Text style={styles.eventsStatus}>{item.isPublic ? "Public" : "Private"}</Text>
            
          </TouchableOpacity>
        )}
      />

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
                  <Text style={styles.modalLocation}>Location: {selectedEvent.location || 'N/A'}</Text>
                  <Text style={styles.modalDate}>Date: {selectedEvent.date || 'N/A'}</Text>
                  <Text style={styles.modalTime}>Starts: {selectedEvent.startTime || 'N/A'}, Ends: {selectedEvent.endTime || 'N/A'}</Text>
                  <Text style={styles.modalDescription}>{selectedEvent.description}</Text>
                  <Text>{selectedEvent.isPublic ? "Public" : "Private"}</Text>
                </View>
              )}
            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={closeEventDetails}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
            {selectedEvent && selectedEvent.createdBy === auth.currentUser?.uid && (
              <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteEvent}>
                <Text style={styles.deleteButtonText}>Delete Event</Text>
              </TouchableOpacity>
            )}
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
  eventsStatus: {
    fontSize: 14,
    color: '#888',
  },
  eventDescription: {
    fontSize: 14,
    color: '#333',
  },
  bookmarkContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
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
  deleteButton: {
    backgroundColor: '#FF6347',
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginTop: 10,
  },
  deleteButtonText: {
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
