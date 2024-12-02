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
  const [isRegistered, setIsRegistered] = useState(false); // Track registration status


  // Saves the registered user in the 'events' collection under the 'attendees' field in the Firebase database.
  const registerForEvent = async (eventId) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return Alert.alert("You need to be logged in to register for events.");
  
    try {
      const eventRef = doc(db, 'events', eventId);
      const eventSnap = await getDoc(eventRef);
  
      if (eventSnap.exists()) {
        const eventData = eventSnap.data();
        const attendees = eventData.attendees || [];
  
        // Check if the user is already registered
        if (attendees.includes(userId)) {
          Alert.alert("You are already registered for this event.");
          setIsRegistered(true); // Update the registration status
          return;
        }
  
        // Add user to the attendees array
        await updateDoc(eventRef, { attendees: arrayUnion(userId) });
        setIsRegistered(true); // Update the state after successful registration
        Alert.alert("Successfully registered for the event!");
        fetchEvents(); // Refresh events data
      } else {
        Alert.alert("Event not found.");
      }
    } catch (error) {
      console.error("Error registering for event:", error);
      Alert.alert("Failed to register for the event.");
    }
  };
  


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

  // Toggle bookmark status
  const toggleBookmark = async (eventId, isBookmarked) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        console.error("User is not authenticated");
        return;
      }
  
      const userRef = doc(db, "users", userId);
      let userSnap = await getDoc(userRef);
  
      // Handle cases where the user document doesn't exist
      if (!userSnap.exists()) {
        await setDoc(userRef, { bookmarks: [] });
        console.log("User document created.");
        userSnap = await getDoc(userRef); // Re-fetch the newly created document
      }
  
      // Safely access bookmarks with a fallback
      const userData = userSnap.data() || {};
      const bookmarks = userData.bookmarks || [];
  
      // Update bookmarks
      await updateDoc(userRef, {
        bookmarks: isBookmarked ? arrayRemove(eventId) : arrayUnion(eventId),
      });
  
      // Update local state
      setUserBookmarks((prev) =>
        isBookmarked ? prev.filter((id) => id !== eventId) : [...prev, eventId]
      );
  
      fetchEvents(); // Refresh the events list
    } catch (error) {
      console.error("Error updating bookmark: ", error);
      Alert.alert("Failed to update bookmark");
    }
  };

  useEffect(() => {
    fetchUserBookmarks().then(fetchEvents);
  }, []);


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
    <View style={styles.eventCard}>
      {/* Separate TouchableOpacity for the bookmark button */}
      <TouchableOpacity
        style={styles.bookmarkContainer}
        onPress={() => toggleBookmark(item.id, item.isBookmarked)}
      >
        <View style={styles.iconCircle}> 
          <FontAwesome
            name={item.isBookmarked ? "bookmark" : "bookmark-o"}
            size={24}
            color={item.isBookmarked ? "#135119" : "green"}
          />
        </View>
      </TouchableOpacity>

      {/* Separate TouchableOpacity for opening event details */}
      <TouchableOpacity style={styles.eventDetails} onPress={() => openEventDetails(item)}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.eventLocation}>Location: {item.location || 'N/A'}</Text>
        <Text style={styles.eventDate}>Date: {item.date || 'N/A'}</Text>
        <Text style={styles.eventTime}>Starts: {item.startTime || 'N/A'} - Ends: {item.endTime || 'N/A'}</Text>
        <Text style={styles.eventDescription} numberOfLines={3}>{item.description}</Text>
        <Text style={styles.eventsStatus}>{item.isPublic ? "Public" : "Private"}</Text>
       
      </TouchableOpacity>
    </View>
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

            {/* Status and tags container */}
            <View style={styles.statusAndTagsContainer}>
              <Text style={selectedEvent.isPublic ? styles.publicText : styles.privateText}>
                {selectedEvent.isPublic ? "PUBLIC" : "PRIVATE"}
              </Text>

              {/* Display tags beside the Public/Private label */}
              {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {selectedEvent.tags.map((tag, index) => (
                    <Text key={index} style={styles.tag}>
                      {tag.toUpperCase()}
                    </Text>
                  ))}
                </View>
              )}
            </View>
            {/* Headcount section */}
           {/* Headcount section */}
<View style={styles.modalHeadcount}>
  <View style={styles.headcountRow}>
    <View style={styles.iconCircle2}>
      <FontAwesome
        name="user" // FontAwesome icon for a human head
        size={18}    // Adjust size as needed
        color="#0C5449" // Icon color (adjust as needed)
        style={styles.headIcon}
      />
    </View>
    <Text style={styles.headcountText}>
      {selectedEvent.attendees && selectedEvent.attendees.length > 0
        ? `${selectedEvent.attendees.length} student${selectedEvent.attendees.length > 1 ? 's' : ''} going`
        : 'No students going'}
    </Text>
  </View>
</View>
          </View>
        )}
      </ScrollView>

      {/* Register Button */}
      <TouchableOpacity
        style={styles.registerButton}
        onPress={() => registerForEvent(selectedEvent.id)}
      >
        <Text style={styles.registerButtonText}>Register</Text>
      </TouchableOpacity>

      {/* Close Button - Cross Icon at Top Right */}
      <TouchableOpacity style={styles.closeButton} onPress={closeEventDetails}>
        <FontAwesome name="times" size={20} color="#0C5449" />
      </TouchableOpacity>

      {/* Delete Button - Move to Bottom Right */}
      {selectedEvent && selectedEvent.createdBy === auth.currentUser?.uid && (
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteEvent}>
          <FontAwesome name="trash" size={24} color="white" /> {/* Trash icon */}
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
    flexWrap: 'wrap', // Allow the title to wrap to the next line
    maxWidth: '80%',  // You can control the width to avoid it stretching too far
    
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
    zIndex: 1, // Make sure the bookmark is on top of other elements
  },
  // Modal Styles
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8, // Reduced margin for consistency
    color: '#0C5449',
  },
  modalLocation: {
    fontSize: 16,
    marginBottom: 6, // Uniform margin
    fontWeight: 'bold',
  },
  modalDate: {
    fontSize: 16,
    marginBottom: 6, // Uniform margin
    fontWeight: 'bold',
  },
  modalDescription: {
    fontSize: 16,
    marginTop: 8, // Adjusted for consistency
    marginBottom: 15, // Reduced bottom margin
  },
  // Close Button Style
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 50,
    width: 40, // Set a fixed width
    height: 40, // Set a fixed height to match the width
    justifyContent: 'center', // Center the content vertically
    alignItems: 'center', // Center the content horizontally
    elevation: 2,
  },
  
  // Delete Button Style
  deleteButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#d34b16',
    borderRadius: 50, // Ensures the button is circular
    width: 35, // Set a fixed width
    height: 35, // Set a fixed height to match the width
    justifyContent: 'center', // Center the content vertically
    alignItems: 'center', // Center the content horizontally
    elevation: 2,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 18, // Adjust font size to fit inside the button
  },
  registerButton: {
    top: 23,
    left: 80,
    backgroundColor: '#3b64a9',
    borderRadius: 10,
    padding: 8,
    //paddingTop: 5,
   // paddingBottom: 5,
    //paddingLeft: 8,
    //paddingRight: 8,
    elevation: 2,
    marginTop: 10,
  },
  registerButtonText: {
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
  bookmarkText: {
    color: '#0C5449',
    marginTop: 5,
    fontWeight: 'bold',
  },
  iconCircle: {
    width: 40,  // Set the size of the circle
    height: 40, // Set the size of the circle
    borderRadius: 20,  // Make it circular
    backgroundColor: '#e0fae2', // Circle color (change to your preference)
    alignItems: 'center', // Center icon horizontally
    justifyContent: 'center', // Center icon vertically
    overflow: 'hidden',  // Ensures the icon fits inside the circle
    //borderWidth: 1,  // Set the border thickness
    //borderColor: '#000', // Set the border color (change to your preferred color)
  },
    //style for public or private 
    
    
    privateText: {
      color: 'black',              // Text color black
      fontWeight: 'bold',
      backgroundColor: '#c3e4f5',  // Light blue background for private
      paddingHorizontal: 4,        // Smaller horizontal padding
      paddingVertical: 4,          // Vertical padding remains the same
      borderRadius: 20,            // Rounded corners
      textAlign: 'center',         // Center text
      maxWidth: 90,               // Set a max width to limit horizontal size
    },
    
    publicText: {
      color: 'black',              // Text color black
      fontWeight: 'bold',
      backgroundColor: '#fcd5df',      // Red background for public
      paddingHorizontal: 8,        // Smaller horizontal padding
      paddingVertical: 4,          // Vertical padding remains the same
      borderRadius: 20,            // Rounded corners
      textAlign: 'center',         // Center text
      maxWidth: 90,               // Set a max width to limit horizontal size
    },
    modalHeadcount: {
      fontSize: 16,
      color: '#0C5449',
      flexDirection: 'row', // Align icon and text horizontally
      alignItems: 'center', // Vertically center the icon with the text
      marginTop: 20, // Increase the top margin for more space above the headcount text
    },
    headcountRow: {
      flexDirection: 'row',        // Align icon and text horizontally
      alignItems: 'center',        // Vertically center both icon and text
      justifyContent: 'flex-start', // Ensure both align at the start
    },
    
    iconCircle2: {
      width: 30,  // Set the size of the circle
      height: 30, // Set the size of the circle
      borderRadius: 15,  // Make it circular
      backgroundColor: '#daedd6', // Circle color (change to your preference)
      alignItems: 'center', // Center icon horizontally
      justifyContent: 'center', // Center icon vertically
      marginRight: 4, // Add space between the icon and the text
      borderWidth: 1, // Border thickness around the icon
      borderColor: '#0C5449', // Color of the outline around the icon
    },
    statusAndTagsContainer: {
      flexDirection: 'row', // Align Public/Private text and tags horizontally
      alignItems: 'center', // Ensure both elements are vertically aligned
      marginTop: 10,
    },
    tagsContainer: {
      flexDirection: 'row', // Tags will be displayed in a row
      flexWrap: 'wrap', // Wrap tags if there's not enough space
      marginLeft: 10, // Adds spacing between Public/Private and tags
      
    },
    tag: {
      backgroundColor: '#acdfec',
      fontWeight: 'bold',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 10,
      marginRight: 5,
      fontSize: 14,
      
    },
  
 

});

export default PersonalEventsScreen;
