import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, TextInput, ScrollView, Modal, Button, FlatList, Alert } from 'react-native';
import { auth, db } from '../../firebase';
import { doc, getDoc, setDoc, collection, getDocs, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome'; 

import image1 from '../../assets/fall.png';
import image2 from '../../assets/sand.png';
import image3 from '../../assets/lighthouse.png';
import image4 from '../../assets/plane.png';
import image5 from '../../assets/coffee.png';
import image6 from '../../assets/camera.png'; 
import image7 from '../../assets/hands.png';
import image8 from '../../assets/citrus.png';
import image9 from '../../assets/astronaut.png';
import image10 from '../../assets/default.png';


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
    profilePicture: image10,
  });
  const [editableData, setEditableData] = useState(userData);
  const [isModalVisible, setModalVisible] = useState(false); 
  const [bookmarksModalVisible, setBookmarksModalVisible] = useState(false);
  const [bookmarkedEvents, setBookmarkedEvents] = useState([]); 
  const [selectedEvent, setSelectedEvent] = useState(null); 
  const [wsuBookmarksModalVisible, setWsuBookmarksModalVisible] = useState(false);
  const [wsuBookmarkedEvents, setWsuBookmarkedEvents] = useState([]);
  const [profileImageModalVisible, setProfileImageModalVisible] = useState(false); // Modal for selecting profile image


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

  const handleProfileImageChange = async (image) => {
    try {
      // Update the userData state with the new profile image URL
      const updatedData = { ...userData, profilePicture: image };
      setUserData(updatedData);

      // Save the new profile image URL in Firestore
      await setDoc(doc(db, 'profile', auth.currentUser.uid), { profilePicture: image }, { merge: true });
      alert("Profile image updated successfully!");

      // Close the profile image modal
      setProfileImageModalVisible(false);
    } catch (error) {
      console.error("Error updating profile image:", error);
      alert("Error updating profile image. Please try again.");
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

      {/* Profile Image */}
      <TouchableOpacity onPress={() => setProfileImageModalVisible(true)}>
        <Image source={userData.profilePicture} style={styles.profileImage} />
      </TouchableOpacity>


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
        {Object.keys(userData)
          .filter((key) => key !== 'profilePicture') // Exclude profilePicture from being displayed
          .map((key, index, array) => (
            <View key={key}>
              <Text style={styles.value}>
                {`${key.charAt(0).toUpperCase() + key.slice(1)}: ${userData[key] || 'N/A'}`}
              </Text>
              {index < array.length - 1 && <View style={styles.separator} />}
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
          {Object.keys(userData)
            .filter((key) => key !== 'profilePicture') // Exclude profilePicture field
            .map((key) => (
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
                    <TouchableOpacity onPress={() => toggleBookmark(item.id, isBookmarked)}>
                      <Icon
                        name={isBookmarked ? 'bookmark' : 'bookmark-o'}
                        size={24}
                        color={isBookmarked ? 'gold' : 'grey'}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              }}
            />
            <Button title="Close" onPress={() => setBookmarksModalVisible(false)} />
          </View>
        </View>
      </Modal>

      {/* Profile Image Selection Modal */}
      <Modal
        visible={profileImageModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setProfileImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Choose a Profile Picture</Text>
            <View style={styles.imageGrid}>
              {[image1, image2, image3, image4, image5, image6, image7, image8, image9].map((image, index) => (
                <TouchableOpacity key={index} onPress={() => handleProfileImageChange(image)}>
                  <Image source={image} style={styles.gridImage} />
                </TouchableOpacity>
              ))}
            </View>
            <Button title="Close" onPress={() => setProfileImageModalVisible(false)} />
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
                  <Text style={styles.eventDate}>Date: {item.startsOn || 'N/A'}</Text>
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
    width: '80%',
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
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridImage: {
    width: 100,
    height: 100,
    marginBottom: 4,
  },
});

export default ProfileScreen;

