import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { auth, db } from '../../firebase';
import { useFonts } from 'expo-font';
import { Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, getDocs } from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';

// Function to strip HTML from the event description
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

const BookmarksScreen = () => {
  const [bookmarkedEvents, setBookmarkedEvents] = useState([]);
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchBookmarkedEvents(); // Fetch user bookmarks
      setLoading(false); 
    };

    if (bookmarkedEvents.length === 0) {  // Only fetch if bookmarkedEvents haven't been set yet
      loadData();
    }
  }, [bookmarkedEvents]);  // Only re-run when bookmarkedEvents change

  useFocusEffect(
    React.useCallback(() => {
      if (bookmarkedEvents.length === 0) {  // Avoid re-fetching if already fetched
        fetchBookmarkedEvents();
      }
    }, [bookmarkedEvents])  // Only run when bookmarkedEvents change
  );

  const fetchBookmarkedEvents = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const bookmarks = userSnap.data().bookmarks || [];

        // Fetch personal events
        const eventsRef = collection(db, 'events');
        const eventsSnap = await getDocs(eventsRef);
        const personalEventDetails = eventsSnap.docs
          .filter(doc => bookmarks.includes(doc.id))
          .map(doc => ({ id: doc.id, source: 'personal', ...doc.data() }));

        // Fetch WSU events
        const wsuEventsRef = collection(db, 'wsuevents');
        const wsuEventsSnap = await getDocs(wsuEventsRef);
        const wsuEventDetails = wsuEventsSnap.docs
          .filter(doc => bookmarks.includes(doc.id))
          .map(doc => ({
            id: doc.id, 
            source: 'WSU', 
            name: doc.data().name,  // Use 'name' field for WSU event title
            ...doc.data(),
          }));

        // Combine both personal and WSU events
        setBookmarkedEvents([...personalEventDetails, ...wsuEventDetails]);
      }
    } catch (error) {
      console.error("Error fetching bookmarked events: ", error);
      Alert.alert("Failed to load bookmarks");
    }
  };

  const toggleBookmark = async (eventId, isBookmarked, isWsuEvent = false) => {
    try {
      const userId = auth.currentUser?.uid;
      const userRef = doc(db, 'users', userId);

      if (isBookmarked) {
        await updateDoc(userRef, { bookmarks: arrayRemove(eventId) });
        setBookmarkedEvents(prev => prev.filter(event => event.id !== eventId));
      } else {
        await updateDoc(userRef, { bookmarks: arrayUnion(eventId) });

        const eventRef = doc(
          db,
          isWsuEvent ? 'wsuevents' : 'events',
          eventId
        );
        const eventSnap = await getDoc(eventRef);

        setBookmarkedEvents(prev => [
          ...prev,
          { id: eventId, source: isWsuEvent ? 'WSU' : 'personal', ...eventSnap.data() },
        ]);
      }
    } catch (error) {
      console.error("Error updating bookmark: ", error);
      Alert.alert("Failed to update bookmark");
    }
  };
  const formatDate = (dateString) => {
    const date = new Date(dateString); // Convert to a Date object
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`; // Format as MM/DD/YYYY
  };
  

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Bookmarked Events</Text>
      <FlatList
        data={bookmarkedEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
            const isBookmarked = bookmarkedEvents.some(event => event.id === item.id);
            const isWsuEvent = item.source === 'WSU';
            const eventDescription = stripHtmlTags(item.description || 'No description available');

            return (
              <TouchableOpacity style={styles.eventCard}>
                <Text style={styles.eventTitle}>{isWsuEvent ? item.name : item.title}</Text>

<View style={{ flexDirection: 'row', alignItems: 'center' }}>
  <Icon 
    name="map-pin" 
    type="font-awesome" 
    size={13} 
    color="#c21c31" 
    style={{ marginRight: 5 }} 
  />
  <Text style={styles.eventLocation}>{item.location || 'Location: N/A'}</Text>
</View>

<View style={{ flexDirection: 'row', alignItems: 'center' }}>
  <Icon 
    name="clock-o" 
    type="font-awesome" 
    size={14} 
    color="black" 
    style={{ marginRight: 5 }} 
  />
  <Text style={styles.eventDate}>
  {isWsuEvent 
    ? `${formatDate(item.startsOn)}`
    : `${item.date}, ${item.startTime || 'N/A'}`}
</Text>

</View>

<Text style={styles.eventDescription}> {eventDescription}</Text>
                <View style={styles.bookmarkContainer}>
                  <TouchableOpacity onPress={() => toggleBookmark(item.id, isBookmarked, isWsuEvent)}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#E6E5E7',
  },
  header: { 
    fontFamily: 'Montserrat_600SemiBold', 
    fontSize: 18,  
    marginBottom: 20,
    color: '#0C5449',
  },
  eventCard: { 
    padding: 15, 
    marginBottom: 15, 
    backgroundColor: '#FFF', 
    borderRadius: 8, 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 5, 
    elevation: 3, 
  },
  eventTitle: { 
    fontFamily: 'Montserrat_600SemiBold', 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#0C5449', 
  },
  eventLocation: { 
    fontFamily: 'Montserrat_400Regular', 
    fontSize: 14, 
    color: '#555', 
  },
  eventDate: { 
    fontFamily: 'Montserrat_400Regular', 
    fontSize: 14, 
    color: '#555',
    marginVertical: 5,
  },
  eventDescription: { 
    fontFamily: 'Montserrat_400Regular', 
    fontSize: 14, 
    color: '#555', 
    marginVertical: 5,
  },
  eventTime: { 
    fontFamily: 'Montserrat_400Regular', 
    fontSize: 14, 
    color: '#555',
    marginBottom: 10,
  },
  bookmarkContainer: { 
    alignItems: 'flex-end', 
    marginTop: 10, 
  },
});

export default BookmarksScreen;