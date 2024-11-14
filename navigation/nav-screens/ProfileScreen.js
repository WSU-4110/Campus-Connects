import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, TextInput, ScrollView, Modal, Button, FlatList, Alert } from 'react-native';
import { auth, db } from '../../firebase';
import { doc, getDoc, setDoc, collection, getDocs, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome'; 

const ProfileScreen = ({ bookmarks }) => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: auth.currentUser?.email || '',
    dateOfBirth: '',
    year: '',
    major: '',
    clubs: '',
  });
  const [editableData, setEditableData] = useState(userData);
  const [isModalVisible, setModalVisible] = useState(false); 
  const [bookmarksModalVisible, setBookmarksModalVisible] = useState(false);
  const [bookmarkedEvents, setBookmarkedEvents] = useState([]); 
  const [selectedEvent, setSelectedEvent] = useState(null); 
  const [wsuBookmarksModalVisible, setWsuBookmarksModalVisible] = useState(false);
  const [wsuBookmarkedEvents, setWsuBookmarkedEvents] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const docRef = doc(db, 'profile', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const { role, ...dataWithoutRole } = docSnap.data();
          setUserData(prevData => ({ ...prevData, ...dataWithoutRole }));
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    if (bookmarks) {
      setBookmarkedEvents(bookmarks);
    }
  }, [bookmarks]);

  const fetchBookmarkedEvents = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const bookmarks = userSnap.data().bookmarks || [];
        const eventsRef = collection(db, 'events');
        const eventsSnap = await getDocs(eventsRef);
        
        const bookmarkedEventDetails = eventsSnap.docs
          .filter(doc => bookmarks.includes(doc.id))
          .map(doc => ({ id: doc.id, ...doc.data() }));
        
        setBookmarkedEvents(bookmarkedEventDetails);
      }
    } catch (error) {
      console.error("Error fetching bookmarked events: ", error);
      Alert.alert("Failed to load bookmarks");
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      navigation.replace("Login");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSave = async () => {
    try {
      const docRef = doc(db, 'profile', auth.currentUser.uid);
      await setDoc(docRef, editableData, { merge: true });
      setUserData(editableData);
      alert("Profile updated successfully!");
      setModalVisible(false);
    } catch (error) {
      alert("Error saving data: " + error.message);
    }
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  const toggleBookmark = async (eventId, isBookmarked) => {
    try {
      const userId = auth.currentUser?.uid;
      const userRef = doc(db, 'users', userId);

      await setDoc(userRef, {}, { merge: true });

      if (isBookmarked) {
        await updateDoc(userRef, { bookmarks: arrayRemove(eventId) });
        setBookmarkedEvents(prev => prev.filter(event => event.id !== eventId));
      } else {
        await updateDoc(userRef, { bookmarks: arrayUnion(eventId) });
        const eventRef = doc(db, 'events', eventId);
        const eventSnap = await getDoc(eventRef);
        setBookmarkedEvents(prev => [...prev, { id: eventId, ...eventSnap.data() }]);
      }

      fetchBookmarkedEvents(); 
    } catch (error) {
      console.error("Error updating bookmark: ", error);
      Alert.alert("Failed to update bookmark");
    }
  };

  const fetchWsuBookmarkedEvents = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const bookmarks = userSnap.data().bookmarks || [];
        const wsuEventsRef = collection(db, 'wsuevents');
        const wsuEventsSnap = await getDocs(wsuEventsRef);
        
        const wsuBookmarkedEventDetails = wsuEventsSnap.docs
          .filter(doc => bookmarks.includes(doc.id))
          .map(doc => ({ id: doc.id, ...doc.data() }));
        
        setWsuBookmarkedEvents(wsuBookmarkedEventDetails);
      }
    } catch (error) {
      console.error("Error fetching WSU bookmarked events: ", error);
      Alert.alert("Failed to load WSU bookmarks");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <Image
        source={{ uri: 'https://via.placeholder.com/100' }} // Replace with user picture URL
        style={styles.profileImage}
      />

      <Text style={styles.header}>
        {userData.firstName && userData.lastName 
          ? `${userData.firstName} ${userData.lastName}` 
          : 'Profile Information'}
      </Text>

      {/* View Bookmarks Button */}
      <TouchableOpacity 
        style={styles.bookmarksButton}
        onPress={() => { fetchBookmarkedEvents(); setBookmarksModalVisible(true); }}>
        <Text style={styles.bookmarksButtonText}>Personal Event Bookmarks</Text>
      </TouchableOpacity>

      {/* WSU Event Bookmarks Button */}
      <TouchableOpacity 
        style={styles.bookmarksButton}
        onPress={() => { fetchWsuBookmarkedEvents(); setWsuBookmarksModalVisible(true); }}>
        <Text style={styles.bookmarksButtonText}>WSU Event Bookmarks</Text>
      </TouchableOpacity>

      {/* Profile Information */}
      <View style={styles.infoContainer}>
        {Object.keys(userData).map((key, index) => (
          <View key={key}>
            <Text style={styles.value}>{`${key.charAt(0).toUpperCase() + key.slice(1)}: ${userData[key] || 'N/A'}`}</Text>
            {index < Object.keys(userData).length - 1 && <View style={styles.separator} />}
          </View>
        ))}
      </View>

      <TouchableOpacity onPress={() => { setEditableData(userData); setModalVisible(true); }} style={styles.editButton}>
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>

      {/* Profile Edit Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Edit Profile</Text>
            {Object.keys(userData).map((key) => (
              <View key={key} style={styles.modalInputRow}>
                <Text style={styles.label}>{key.charAt(0).toUpperCase() + key.slice(1)}:</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editableData[key]}
                  onChangeText={(text) => setEditableData({ ...editableData, [key]: text })}
                />
              </View>
            ))}
            <Button title="Save" onPress={handleSave} />
            <Button title="Cancel" onPress={() => setModalVisible(false)} color="red" />
          </View>
        </View>
      </Modal>

      {/* Bookmarks Modal */}
      <Modal
        visible={bookmarksModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setBookmarksModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Personal Bookmarked Events</Text>

            <FlatList
              data={bookmarkedEvents}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isBookmarked = bookmarkedEvents.some(event => event.id === item.id);

                return (
                  <TouchableOpacity 
                    style={styles.eventCard}
                    onPress={() => handleEventClick(item)}
                  >
                    <Text style={styles.eventTitle}>{item.title}</Text>
                    <Text style={styles.eventLocation}>Location: {item.location || 'N/A'}</Text>
                    <Text style={styles.eventDate}>Date: {item.date || 'N/A'}</Text>

                    {/* Bookmark Icon */}
                    <View style={styles.bookmarkContainer}>
                    <TouchableOpacity onPress={() => toggleBookmark(item.id, isBookmarked)}>
                      <Icon
                        name={isBookmarked ? 'bookmark' : 'bookmark-o'}
                        size={24}
                        color={isBookmarked ? '#0C5449' : 'grey'}
                      />
                    </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
            <Button title="Close" onPress={() => setBookmarksModalVisible(false)} />
          </View>
        </View>
      </Modal>

      {/* WSU Bookmarks Modal */}
      <Modal
        visible={wsuBookmarksModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setWsuBookmarksModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>WSU Bookmarked Events</Text>

            <FlatList
              data={wsuBookmarkedEvents}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.eventCard}
                  onPress={() => handleEventClick(item)} 
                >
                  <Text style={styles.eventTitle}>{item.name}</Text>
                  <Text style={styles.eventLocation}>Location: {item.location || 'N/A'}</Text>
                  <Text style={styles.eventDate}>Date: {item.startOn || 'N/A'}</Text>
                </TouchableOpacity>
              )}
            />
            <Button title="Close" onPress={() => setWsuBookmarksModalVisible(false)} />
          </View>
        </View>
      </Modal>

      {/* Event Details Modal */}
      {selectedEvent && (
        <Modal
          visible={selectedEvent !== null}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSelectedEvent(null)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalHeader}>{selectedEvent.title}</Text>
              <Text style={styles.eventDescription}>{selectedEvent.description}</Text>
              <Text style={styles.eventLocation}>Location: {selectedEvent.location}</Text>
              <Text style={styles.eventDate}>Date: {selectedEvent.date}</Text>
              <Button title="Close" onPress={() => setSelectedEvent(null)} />
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 80,
    marginBottom: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0C5449',
    marginBottom: 20,
  },
  signOutButton: {
    padding: 2,
  },
  signOutText: {
    color: '#0C5449',
    fontWeight: 'bold',
    fontSize: 16,
  },
  bookmarkContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  infoContainer: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    marginBottom: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  value: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 10,
  },
  editButton: {
    backgroundColor: '#0C5449',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bookmarksButton: {
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#F5F5F5',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookmarksButtonText: {
    fontSize: 15,
    textAlign: 'center',
  },
  bookmarkIcon: {
    marginLeft: 10,
    fontSize: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
     maxHeight: '80%', // Ensure modal doesn't take up entire screen height
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInputRow: {
    marginBottom: 15,
  },
  modalInput: {
    height: 40,
    borderBottomColor: '#0C5449',
    borderBottomWidth: 1,
    width: '100%',
    padding: 5,
  },
  eventDescription: {
    marginTop: 10,
    fontSize: 14,
    color: '#555',
  },
  eventLocation: {
    fontSize: 14,
    color: '#777',
  },
  eventDate: {
    fontSize: 14,
    color: '#777',
  },
  eventCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 10,
    borderRadius: 5,
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0C5449',
  },
});

export default ProfileScreen;

