import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Switch,
  Text,
  View,
  FlatList,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { db, auth } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';
import { useFonts } from 'expo-font';

const GOOGLE_MAPS_API_KEY = 'AIzaSyDErTBfHz5vRT8AafrF1B5PgErR8MKJAsk'; // Replace with your API key

const CreateEventScreen = () => {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [autocompleteResults, setAutocompleteResults] = useState([]);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [tags, setTags] = useState('');
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  });

  const fetchAutocomplete = async (input) => {
    try {
      if (!input) return;

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          input
        )}&radius=2000&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      if (data.status === 'OK') {
        setAutocompleteResults(data.predictions);
      } else {
        setAutocompleteResults([]);
      }
    } catch (error) {
      console.error('Error fetching autocomplete results:', error);
    }
  };

  const handleSelectLocation = (place) => {
    setLocation(place.description);
    setAutocompleteResults([]);
  };

  const handleCreateEvent = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('You must be logged in to create an event.');
      return;
    }

    if (!title || !date || !startTime || !endTime || !location) {
      Alert.alert('Please fill in all required fields.');
      return;
    }

    try {
      const eventData = {
        title,
        description,
        date,
        startTime,
        endTime,
        location,
        isPublic,
        tags: tags.split(',').map((tag) => tag.trim()).slice(0, 2),
        createdBy: user.uid,
        creatorEmail: user.email,
        createdAt: new Date(),
      };

      await addDoc(collection(db, 'events'), eventData);
      Alert.alert('Event created successfully!');
      navigation.goBack();

      setTitle('');
      setDescription('');
      setLocation('');
      setDate('');
      setStartTime('');
      setEndTime('');
      setIsPublic(false);
      setTags('');
    } catch (error) {
      console.error('Error adding event: ', error);
      Alert.alert('Failed to create event');
    }
  };

  return (
    <View style={styles.container}>

      <Text style={styles.header}>Create a New Event</Text>
      <TextInput
        style={styles.input}
        placeholder="Event Title"
        value={title}
        onChangeText={setTitle}
        placeholderTextColor="#aaa"
      />
      <TextInput
        style={styles.input}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        placeholderTextColor="#aaa"
      />
      <TextInput
        style={styles.input}
        placeholder="Location"
        value={location}
        onChangeText={(text) => {
          setLocation(text);
          fetchAutocomplete(text);
        }}
        placeholderTextColor="#aaa"
      />
      {autocompleteResults.length > 0 && (
        <FlatList
          data={autocompleteResults}
          keyExtractor={(item) => item.place_id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.suggestionItem}
              onPress={() => handleSelectLocation(item)}
            >
              <Text style={styles.suggestionText}>{item.description}</Text>
            </TouchableOpacity>
          )}
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="Date (MM/DD/YYYY)"
        value={date}
        onChangeText={setDate}
        placeholderTextColor="#aaa"
      />
      <TextInput
        style={styles.input}
        placeholder="Start Time (HH:MM AM/PM)"
        value={startTime}
        onChangeText={setStartTime}
        placeholderTextColor="#aaa"
      />
      <TextInput
        style={styles.input}
        placeholder="End Time (HH:MM AM/PM)"
        value={endTime}
        onChangeText={setEndTime}
        placeholderTextColor="#aaa"
      />
      <TextInput
        style={styles.input}
        placeholder="Tags (e.g., guidance, networking)"
        value={tags}
        onChangeText={setTags}
        placeholderTextColor="#aaa"
      />
      <View style={styles.switchContainer}>
        <Text style={styles.label}>Publish the event?</Text>
        <Switch
          value={isPublic}
          onValueChange={setIsPublic}
          thumbColor={isPublic ? '#0C5449' : 'white'}
          trackColor={{ false: '#ccc', true: '#8CAE82' }}
        />
      </View>
      <TouchableOpacity style={styles.button} onPress={handleCreateEvent}>
        <Text style={styles.buttonText}>Create Event</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CreateEventScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6E5E7',
    padding: 20,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1,
  },
  header: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 18,
    color: '#0C5449',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    fontFamily: 'Montserrat_400Regular',
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    fontSize: 14,
    color: '#333',
  },
  suggestionItem: {
    backgroundColor: '#fff',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  label: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 14,
    color: '#333',
  },
  button: {
    backgroundColor: '#8CAE82',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
});