import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal } from 'react-native';
import { useFonts } from 'expo-font';
import { Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { db, auth } from '../../firebase';
import { doc, getDoc, updateDoc, arrayUnion, query, where, arrayRemove, setDoc, collection, getDocs } from 'firebase/firestore';

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
  const [personalEvents, setPersonalEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userBookmarks, setUserBookmarks] = useState([]);
  const navigation = useNavigation();
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

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
      
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventId ? { ...event, isBookmarked: !isBookmarked } : event
        )
      );
      
      setPersonalEvents(prevPersonalEvents => 
        prevPersonalEvents.map(event => 
          event.id === eventId ? { ...event, isBookmarked: !isBookmarked } : event
        )
      );
      
      fetchEventsData(); 
      fetchPersonalEvents(); 
    } catch (error) {
      console.error("Error updating bookmark: ", error); 
      Alert.alert("Failed to update bookmark");
    }
  };

  const openEventDetails = (event) => {
    setSelectedEvent(event);
    setModalVisible(true);
  };

  const closeEventDetails = () => {
    setModalVisible(false);
    setSelectedEvent(null);
  };

// Fetching personal events

  const PersonalEventsScreen = () => {
    const navigation = useNavigation();
    const [eventsData, setEventsData] = useState([]);
    const [userBookmarks, setUserBookmarks] = useState([]); 
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isRegistered, setIsRegistered] = useState(false); 
  }
  
  const fetchPersonalEvents = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'events')); 
      const allEventsArray = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(), 
      }));
  
      setPersonalEvents(allEventsArray);
      console.log('Fetched all events:', allEventsArray.length); 
    } catch (error) {
      console.error('Error fetching all events:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true); 
      await fetchUserBookmarks(); 
      await fetchEventsData();  
      await fetchPersonalEvents(); 
      setLoading(false); 
    };
  
    if (userBookmarks.length === 0) {  
      loadData();
    }
  }, [userBookmarks]);  
  
  useFocusEffect(
    React.useCallback(() => {
      if (!userBookmarks.length) {  // Avoid re-fetching if already fetched
        fetchUserBookmarks().then(() => {
          fetchEventsData();
          fetchPersonalEvents();
        });
      }
    }, [userBookmarks])  
  );

  if (loading) { // Loading indicator
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0C5449" />
        <Text>Loading events...</Text>
      </View>
    );
  }

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0C5449" />
        <Text>Loading events...</Text>
      </View>
    );
  }
  return (
  
 
    <View style={styles.container}>
      
      <View style={styles.topContent}>
        <Image
          source={require('../../assets/image6.png')}
          style={styles.bannerImage}
        />
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => navigation.navigate('CreateEvent')}
          >
            <Icon name="plus" size={16} color="#000" style={styles.icon} />
            <Text style={styles.buttonText}>Create Event</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.navigate('Bookmarks')}
          >
            <Icon name="bookmark" size={16} color="#000" style={styles.icon} />
            <Text style={styles.buttonText}>View Bookmarks</Text>
          </TouchableOpacity>
        </View>

      </View>

        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Wayne State University</Text>
            <TouchableOpacity
              onPress={() => navigation.push('Events')}
            >
              <Text style={styles.linkText}>View All</Text>
          </TouchableOpacity>
      </View>
        
        <View style={styles.eventsContainer}>
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
                    onPress={() => openEventDetails(event)}
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
                          style={styles.bookmarkContainer}
                          onPress={() => toggleBookmark(event.id, event.isBookmarked)}
                        >
                          <View style={styles.iconCircle}>
                            <Icon
                              name={event.isBookmarked ? "bookmark" : "bookmark-o"}
                              size={24}
                              color={event.isBookmarked ? "#0C5449" : "grey"}
                            />
                          </View>
                      </TouchableOpacity>
                    </View>
                    
                    
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>

        {/* Personal Events Scroll */}


        <View style={styles.headerContainer2}>
        <Text style={styles.headerText}>Campus Connects</Text>
              <TouchableOpacity
                onPress={() => navigation.push('PersonalEvents')}
              >
                <Text style={styles.linkText}>View All</Text>
              </TouchableOpacity>
        </View>

        <View style={styles.personalEventsContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.eventsScrollContent}
            >
              {personalEvents.map((event) => (
                <TouchableOpacity key={event.id} style={styles.eventCard}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventDescription} numberOfLines={3}>{event.description}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                        <Icon 
                            name="map-pin"
                            type="font-awesome" 
                            size={13} 
                            color="#808080" 
                            style={{ marginRight: 5 }}
                        />
                        <Text style={styles.eventLocation} numberOfLines={1}>Location: {event.location || 'N/A'}</Text>
                </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                        <Icon 
                            name="clock-o"
                            type="font-awesome" 
                            size={14} 
                            color="#808080"
                            style={{ marginRight: 5 }}
                        />
                         <Text style={styles.eventDate}>
                            {event.date || 'N/A'}, <Text style={styles.eventTime}>{event.startTime || 'N/A'} - {event.endTime || 'N/A'}</Text>
                         </Text>

                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                      <Text style={styles.eventsStatus}>{event.isPublic ? "Public" : "Private"}</Text>

                      <TouchableOpacity
                        style={styles.bookmarkContainer}
                        onPress={() => toggleBookmark(event.id, event.isBookmarked)}
                      >
                        <View style={styles.iconCircle}>
                          <Icon
                            name={event.isBookmarked ? "bookmark" : "bookmark-o"} // Ensure correct icon based on isBookmarked
                            size={24}
                            color={event.isBookmarked ? "#0C5449" : "grey"} // Change color based on isBookmarked
                          />
                        </View>
                      </TouchableOpacity>

                    </View>
                
            
        
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>


        {/* Modal for event details */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeEventDetails}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              {selectedEvent && (
                <View>
                  <Text style={styles.modalTitle}>{selectedEvent.name}</Text>
                  <Text style={styles.modalLocation}>Location: {selectedEvent.location}</Text>
                  <Text style={styles.modalTime}>
                    Starts: {new Date(selectedEvent.startsOn).toLocaleString()}
                  </Text>
                  <Text style={styles.modalDescription}>
                    {stripHtmlTags(selectedEvent.description)}
                  </Text>
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
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  bannerText: {
    position: 'absolute',
    color: 'white',
    fontSize: 48,
    fontWeight: 'bold',
    fontFamily: 'Montserrat_600Semibold', 
    textAlign: 'center',
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
    left: 25,
    right: 10,
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    fontFamily: 'Montserrat_600Semibold',
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
  iconCircle: {
    marginRight: 20,
    width: 40,  
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#e0fae2', 
    alignItems: 'center', 
    justifyContent: 'center',
    overflow: 'hidden', 
  },
  headerText: {
    fontSize: 18,
    fontFamily: 'Montserrat_600SemiBold',
    marginBottom: 5,
    marginLeft: 20,
  },
  fixedPosition: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },

linkText: {
  color: 'grey', 
  fontFamily: 'Montserrat_600Semibold',
  fontSize: 16,
},
headerContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'left',
  marginLeft: 0,
  marginHorizontal: 20,
  marginTop: -75, 
  marginBottom: 0,
},
headerContainer2:{
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'left',
  marginLeft: 0,
  marginHorizontal: 20,
  marginTop: 30, 
  marginBottom: -10,

},
bookmarkContainer:{
  marginLeft: 'auto',
},
loadingContainer: {
  flex: 1,
  justifyContent: 'center', 
  alignItems: 'center',
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: '#E6E5E7',
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
  borderRadius: 10,
  padding: 20,
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 2
  },
  shadowOpacity: 0.25,
  shadowRadius: 4,
  elevation: 5,
  width: '80%',
  maxHeight: '70%',
},
modalScrollContent: {
  paddingBottom: 20,
},
modalTitle: {
  fontFamily: 'Montserrat_600Semibold',
  fontSize: 20,
  marginBottom: 5,
  color: '#0C5449',
},
modalLocation: {
  fontSize: 14,
  marginBottom: 5,
  fontFamily: 'Montserrat_500Medium',
},
modalTime: {
  fontSize: 14,
  marginBottom: 5,
  fontFamily: 'Montserrat_500Medium',
},
modalDescription: {
  fontSize: 14,
  marginTop: 5
},
closeButton: {
  backgroundColor: '#0C5449',
  borderRadius: 10,
  padding: 8,
  elevation: 2,
  marginTop: 10, 
},
closeButtonText: {
  color: 'white',
  fontWeight: 'bold',
  textAlign: 'center',
},
personalEventsContainer: {
  marginTop: 20,
},
personalEventsTitle: {
  fontSize: 18,
  fontFamily: 'Montserrat_500Medium',
  color: '#0C5449',
  marginBottom: 10,
},
personalEventCard: {
  width: width * 0.85,
  height: 220,
  marginRight: 15,
  padding: 16,
  backgroundColor: 'white',
  borderRadius: 12,
},
eventDate: {
  fontSize: 14,
  marginBottom: 0,
  fontFamily: 'Montserrat_400Regular',
  color: 'grey', 
},
eventsStatus:{
  marginTop: 10,
}
});

export default EventsScreenAlt;