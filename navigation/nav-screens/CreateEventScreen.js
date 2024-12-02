// CreateEventScreen.js
import React, { useState } from 'react';
import { StyleSheet, TextInput, Button, Switch, Text, View, Alert } from 'react-native';
import { db, auth } from '../../firebase'; // Firestore and Auth imports
import { collection, addDoc } from 'firebase/firestore'; // Firestore functions
import { useNavigation } from '@react-navigation/native';

const CreateEventScreen = () => {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [tags, setTags] = useState(''); // Tags input state

  // Function to handle event creation
  const handleCreateEvent = async () => {
    const user = auth.currentUser; // Get the current logged-in user
    if (!user) {
      Alert.alert("You must be logged in to create an event.");
      return;
    }

    try {
      // Collect the event details
      const eventData = {
        title,
        description,
        date,
        startTime,
        endTime,
        location,
        isPublic,
        tags: tags.split(',').map(tag => tag.trim()).slice(0, 2), // Process and limit tags to 2
        createdBy: user.uid,
        creatorEmail: user.email,
        createdAt: new Date(),
      };

      // Add the event to Firestore in the 'events' collection
      await addDoc(collection(db, "events"), eventData);
      Alert.alert("Event created successfully!");
      navigation.goBack(); // Go back to the previous screen

      // Clear the form
      setTitle('');
      setDescription('');
      setLocation('');
      setDate('');
      setStartTime('');
      setEndTime('');
      setIsPublic(false);
      setTags('');
    } catch (error) {
      console.error("Error adding event: ", error);
      Alert.alert("Failed to create event");
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Event Title"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={styles.input}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
      />
      <TextInput
        style={styles.input}
        placeholder="Location"
        value={location}
        onChangeText={setLocation}
      />
      <TextInput
        style={styles.input}
        placeholder="Date (MM/DD/YYYY)"
        value={date}
        onChangeText={setDate}
      />
      <TextInput
        style={styles.input}
        placeholder="Start Time (HH:MM AM/PM)"
        value={startTime}
        onChangeText={setStartTime}
      />
      <TextInput
        style={styles.input}
        placeholder="End Time (HH:MM AM/PM)"
        value={endTime}
        onChangeText={setEndTime}
      />
      <TextInput
        style={styles.input}
        placeholder="Tags (e.g., guidance, networking)"
        value={tags}
        onChangeText={setTags} // Update the tags state
      />
      <View style={styles.switchContainer}>
        <Text style={styles.link}>Make this event public?</Text>
        <Switch
          value={isPublic}
          onValueChange={setIsPublic} // Toggle public/private
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button color="#0C5449" title="Create Event" onPress={handleCreateEvent} />
      </View>
    </View>
  );
};

export default CreateEventScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f3f4f3',
    flex: 1,
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 12,
    borderRadius: 10,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  link: {
    color: '#0C5449',
    fontSize: 16,
    fontWeight: 'normal',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    borderRadius: 10,
    overflow: 'hidden',
  },
});
