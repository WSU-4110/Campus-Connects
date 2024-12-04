import React, { useEffect, useState, useCallback, useRef }, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useFonts } from 'expo-font';
import { Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { db, auth } from '../../firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc, collection } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

// Function to fetch events from the API
const fetchEvents = async () => {
  const url = 'https://getinvolved.wayne.edu/api/discovery/event/search';
  const headers = {
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Content-Type': 'application/json',
    'Referer': 'https://getinvolved.wayne.edu/events',
  };

  try {
    const response = await fetch(url, { method: 'GET', headers });
    if (!response.ok) {
      throw new Error(`Error fetching events: ${response.statusText}`);
    }
    const data = await response.json();
    return data; 
  } catch (error) {
    console.error('Error fetching events:', error);
    return null; 
  }
};

// Strip HTML from the event description, adjust spacing 
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


const EventsScreenAlt = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userBookmarks, setUserBookmarks] = useState([]);
  const navigation = useNavigation();
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  });

  // Functions from EventsScreen.js
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

  const storeEventsInFirestore = async (eventsData) => {
    const eventsCollection = collection(db, 'wsuevents');

    for (const event of eventsData) {
      const eventRef = doc(eventsCollection, event.id); 
      await setDoc(eventRef, {
        name: event.name,
        location: event.location, 
        startsOn: event.startsOn, 
        endsOn: event.endsOn, 
        description: event.description, 
      }, { merge: true }); 
    }
  };

  const fetchEventsData = useCallback(async () => { 
    try {
      const eventsData = await fetchEvents();
      if (eventsData && Array.isArray(eventsData.value)) {
        await storeEventsInFirestore(eventsData.value); 
        const now = new Date();
        const sortedEvents = eventsData.value
          .sort((a, b) => {
            const diffA = Math.abs(now - new Date(a.startsOn));    
            const diffB = Math.abs(now - new Date(b.startsOn));
            return diffA - diffB;
          })
          .slice(0, 25);
        
        const eventsWithBookmarks = sortedEvents.map(event => ({
          ...event,
          isBookmarked: userBookmarks.includes(event.id), 
        }));

        setEvents(eventsWithBookmarks);
        console.log('Fetched and sorted events:', eventsWithBookmarks.length);
      } else {
        console.log('No events found', eventsData);
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  }, [userBookmarks]);

  const toggleBookmark = async (eventId, isBookmarked) => {
    try {
      const userId = auth.currentUser?.uid; 
      if (!userId) {
        console.error("User is not authenticated");
        return; 
      }

      const userRef = doc(db, 'users', userId); 

      await updateDoc(userRef, { 
        bookmarks: isBookmarked ? arrayRemove(eventId) : arrayUnion(eventId) 
      });
      
      setUserBookmarks(prev => 
        isBookmarked ? prev.filter(id => id !== eventId) : [...prev, eventId]
      );
      
      fetchEventsData(); 
    } catch (error) {
      console.error("Error updating bookmark: ", error); 
      Alert.alert("Failed to update bookmark");
    }
  };

  useEffect(() => {
    fetchUserBookmarks().then(fetchEventsData);
  }, []);

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0C5449" />
      </View>
    );
  }

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userBookmarks, setUserBookmarks] = useState([]);
  const navigation = useNavigation();
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  });

  // Functions from EventsScreen.js
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

  const storeEventsInFirestore = async (eventsData) => {
    const eventsCollection = collection(db, 'wsuevents');

    for (const event of eventsData) {
      const eventRef = doc(eventsCollection, event.id); 
      await setDoc(eventRef, {
        name: event.name,
        location: event.location, 
        startsOn: event.startsOn, 
        endsOn: event.endsOn, 
        description: event.description, 
      }, { merge: true }); 
    }
  };

  const fetchEventsData = useCallback(async () => { 
    try {
      const eventsData = await fetchEvents();
      if (eventsData && Array.isArray(eventsData.value)) {
        await storeEventsInFirestore(eventsData.value); 
        const now = new Date();
        const sortedEvents = eventsData.value
          .sort((a, b) => {
            const diffA = Math.abs(now - new Date(a.startsOn));    
            const diffB = Math.abs(now - new Date(b.startsOn));
            return diffA - diffB;
          })
          .slice(0, 25);
        
        const eventsWithBookmarks = sortedEvents.map(event => ({
          ...event,
          isBookmarked: userBookmarks.includes(event.id), 
        }));

        setEvents(eventsWithBookmarks);
        console.log('Fetched and sorted events:', eventsWithBookmarks.length);
      } else {
        console.log('No events found', eventsData);
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  }, [userBookmarks]);

  const toggleBookmark = async (eventId, isBookmarked) => {
    try {
      const userId = auth.currentUser?.uid; 
      if (!userId) {
        console.error("User is not authenticated");
        return; 
      }

      const userRef = doc(db, 'users', userId); 

      await updateDoc(userRef, { 
        bookmarks: isBookmarked ? arrayRemove(eventId) : arrayUnion(eventId) 
      });
      
      setUserBookmarks(prev => 
        isBookmarked ? prev.filter(id => id !== eventId) : [...prev, eventId]
      );
      
      fetchEventsData(); 
    } catch (error) {
      console.error("Error updating bookmark: ", error); 
      Alert.alert("Failed to update bookmark");
    }
  };

  useEffect(() => {
    fetchUserBookmarks().then(fetchEventsData);
  }, []);

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0C5449" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      <View style={styles.topContent}>
        <Image
        <Image
          source={require('../../assets/image6.png')}
          style={styles.bannerImage}
        />
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => navigation.navigate('CreateEvent')}
          >
            <Icon name="plus" size={16} color="#0C5449" style={styles.icon} />
            <Text style={styles.buttonText}>Create Event</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.button}
          >
            <Icon name="bookmark" size={16} color="#000" style={styles.icon} />
            <Text style={styles.buttonText}>View Bookmarks</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => navigation.navigate('CreateEvent')}
          >
            <Icon name="plus" size={16} color="#0C5449" style={styles.icon} />
            <Text style={styles.buttonText}>Create Event</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.button}
          >
            <Icon name="bookmark" size={16} color="#000" style={styles.icon} />
            <Text style={styles.buttonText}>View Bookmarks</Text>
          </TouchableOpacity>
        </View>
      </View>


        <Text style={styles.headerText}>Wayne State University</Text>
        
        <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.eventsScroll}
            contentContainerStyle={styles.eventsScrollContent}
        >
            {events.map((event) => (
                <TouchableOpacity 
                    key={event.id} 
                    style={styles.eventCard}
                    onPress={() => {/* handle event press */}}
                    activeOpacity={0.5} 
                >
                    <Text style={styles.eventTitle} numberOfLines={2}>{event.name}</Text>
                    <Text style={styles.eventDescription} numberOfLines={4}>
                        {stripHtmlTags(event.description)}
                    </Text>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                        <Icon 
                            name="map-pin"
                            type="font-awesome" 
                            size={13} 
                            color="#808080" 
                            style={{ marginRight: 5 }}
                        />
                        <Text style={styles.eventLocation} numberOfLines={1}>
                            {event.location}
                        </Text>
                    </View>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                        <Icon 
                            name="clock-o"
                            type="font-awesome" 
                            size={14} 
                            color="#808080"
                            style={{ marginRight: 5 }}
                        />
                        <Text style={styles.eventTime}>
                            {new Date(event.startsOn).toLocaleString()}
                        </Text>

                        <TouchableOpacity 
                        style={styles.bookmarkButton}
                        onPress={() => toggleBookmark(event.id, event.isBookmarked)}
                    >
                        <Icon 
                            name={event.isBookmarked ? "bookmark" : "bookmark-o"} 
                            size={24} 
                            color={event.isBookmarked ? "#0C5449" : "grey"} 
                        />
                    </TouchableOpacity>
                    </View>
                    
                    
                </TouchableOpacity>
            ))}
        </ScrollView>


        <Text style={styles.headerText}>Wayne State University</Text>
        
        <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.eventsScroll}
            contentContainerStyle={styles.eventsScrollContent}
        >
            {events.map((event) => (
                <TouchableOpacity 
                    key={event.id} 
                    style={styles.eventCard}
                    onPress={() => {/* handle event press */}}
                    activeOpacity={0.5} 
                >
                    <Text style={styles.eventTitle} numberOfLines={2}>{event.name}</Text>
                    <Text style={styles.eventDescription} numberOfLines={4}>
                        {stripHtmlTags(event.description)}
                    </Text>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                        <Icon 
                            name="map-pin"
                            type="font-awesome" 
                            size={13} 
                            color="#808080" 
                            style={{ marginRight: 5 }}
                        />
                        <Text style={styles.eventLocation} numberOfLines={1}>
                            {event.location}
                        </Text>
                    </View>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                        <Icon 
                            name="clock-o"
                            type="font-awesome" 
                            size={14} 
                            color="#808080"
                            style={{ marginRight: 5 }}
                        />
                        <Text style={styles.eventTime}>
                            {new Date(event.startsOn).toLocaleString()}
                        </Text>

                        <TouchableOpacity 
                        style={styles.bookmarkButton}
                        onPress={() => toggleBookmark(event.id, event.isBookmarked)}
                    >
                        <Icon 
                            name={event.isBookmarked ? "bookmark" : "bookmark-o"} 
                            size={24} 
                            color={event.isBookmarked ? "#0C5449" : "grey"} 
                        />
                    </TouchableOpacity>
                    </View>
                    
                    
                </TouchableOpacity>
            ))}
        </ScrollView>
      </View>
    
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6E5E7',
  },
  topContent: {
    width: '100%',
    height: height * 0.3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
    position: 'relative',
    top: -50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
    top: -50,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    resizeMode: 'contain',
  },
  bannerText: {
    position: 'absolute',
    position: 'absolute',
    color: 'white',
    fontSize: 48,
    fontSize: 48,
    fontWeight: 'bold',
    fontFamily: 'Montserrat_600Semibold', 
    fontFamily: 'Montserrat_600Semibold', 
    textAlign: 'center',
    center: 25,
    center: 25,
  },
  bottomContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Montserrat_400Regular', 
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: '50%',
    left: 15,
    right: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 30,
    paddingVertical: 20,
    paddingHorizontal: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Montserrat_500Medium',
    textAlign: 'center',
    marginLeft: 5,
  },
  icon: {
    marginRight: 5,
  },
  eventsScroll: {
    marginTop: 10,
  },
  eventsScrollContent: {
    paddingHorizontal: 15,
  },
  eventCard: {
    width: width * 0.85,
    height: 220,
    marginRight: 15,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  eventTitle: {
    marginTop:5,
    fontSize: 16,
    fontWeight: '600',
    color: '#0C5449',
    marginBottom: 3,
    fontFamily: 'Montserrat_600SemiBold',
  },
  eventLocation: {
    color: 'grey',
    marginBottom: 0,
    marginTop: 0,
    fontFamily: 'Montserrat_400Regular',
    fontSize: 14,
  },
  eventTime: {
    color: 'grey',
    marginBottom: 3,
    fontFamily: 'Montserrat_400Regular',
    fontSize: 14,
  },
  eventDescription: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 14,
    marginBottom: 10,
    marginTop: 10,
    color: '#333',
    maxHeight: 75,
  },
  bookmarkButton: {
    position: 'absolute',
    right: 12,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Montserrat_400Medium',
    marginBottom: 5,
    marginLeft: 20,
    marginTop: -75,
    
  },
  fixedPosition: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
    fontFamily: 'Montserrat_400Regular', 
  },
  buttonContainer: {
    flexDirection: 'row',
    //justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    top: '50%',
    left: 15,
    right: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 30,
    paddingVertical: 20,
    paddingHorizontal: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Montserrat_500Medium',
    textAlign: 'center',
    marginLeft: 5,
  },
  icon: {
    marginRight: 5,
  },
  eventsScroll: {
    marginTop: 10,
  },
  eventsScrollContent: {
    paddingHorizontal: 15,
  },
  eventCard: {
    width: width * 0.85,
    height: 220,
    marginRight: 15,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  eventTitle: {
    marginTop:5,
    fontSize: 16,
    fontWeight: '600',
    color: '#0C5449',
    marginBottom: 3,
    fontFamily: 'Montserrat_600SemiBold',
  },
  eventLocation: {
    color: 'grey',
    marginBottom: 0,
    marginTop: 0,
    fontFamily: 'Montserrat_400Regular',
    fontSize: 14,
  },
  eventTime: {
    color: 'grey',
    marginBottom: 3,
    fontFamily: 'Montserrat_400Regular',
    fontSize: 14,
  },
  eventDescription: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 14,
    marginBottom: 10,
    marginTop: 10,
    color: '#333',
    maxHeight: 75,
  },
  bookmarkButton: {
    position: 'absolute',
    right: 12,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Montserrat_400Medium',
    marginBottom: 5,
    marginLeft: 20,
    marginTop: -75,
    
  },
  fixedPosition: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
});

export default EventsScreenAlt;
