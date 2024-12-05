import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { auth, db } from '../../firebase';
import { useFonts } from 'expo-font';
import { Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, getDocs } from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native'; // Ensure this import is present

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

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Bookmarked Events</Text>
      <FlatList
        data={bookmarkedEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
            const isBookmarked = bookmarkedEvents.some(event => event.id === item.id);
            const isWsuEvent = item.source === 'WSU';
          
            return (
              <TouchableOpacity style={styles.eventCard}>
                <Text style={styles.eventTitle}>{isWsuEvent ? item.name : item.title}</Text>
                <Text style={styles.eventLocation}>Location: {item.location || 'N/A'}</Text>
                <Text style={styles.eventDate}>Date: {item.date || 'N/A'}</Text>
                <Text style={styles.eventDescription}>Description: {item.description || 'No description available'}</Text>
                <Text style={styles.eventTime}>Time: {item.time || 'N/A'}</Text>
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
  container: { flex: 1, padding: 20 },
  header: { fontFamily: 'Montserrat_600SemiBold', fontSize: 16, fontWeight: 'bold', marginBottom: 20 },
  eventCard: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  eventTitle: { fontFamily: 'Montserrat_600SemiBold', fontSize: 16, fontWeight: 'bold' },
  eventLocation: { fontFamily: 'Montserrat_400Regular', fontSize: 14 },
  eventDate: { fontFamily: 'Montserrat_400Regular', fontSize: 14 },
  eventDescription: { fontFamily: 'Montserrat_400Regular', fontSize: 14, marginTop: 5 },
  eventTime: { fontFamily: 'Montserrat_400Regular', fontSize: 14, marginTop: 5 },
  bookmarkContainer: { marginTop: 10, alignItems: 'flex-end' },
});

export default BookmarksScreen;
