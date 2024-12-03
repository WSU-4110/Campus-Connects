import { KeyboardAvoidingView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import React, { useState } from 'react';
import { auth } from '../firebase';
import { doc, setDoc } from "firebase/firestore";
import { db } from '../firebase';
import { useNavigation } from '@react-navigation/native';

const OnboardScreen = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [year, setYear] = useState('');
  const [major, setMajor] = useState('');
  const [clubs, setClubs] = useState('');
  const navigation = useNavigation();

  const handleSaveInfo = async () => {
    try {
      const userId = auth.currentUser.uid;

      await setDoc(doc(db, 'profile', userId), {
        firstName,
        lastName,
        dateOfBirth,
        year,
        major,
        clubs,
      }, { merge: true });

      alert("Additional information saved. Verify your Email");

      await auth.signOut();
      navigation.navigate("Login"); 
    } catch (error) {
      alert("Error saving information: " + error.message);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <Text style={styles.header}>Additional Information</Text>
      
      <TextInput
        placeholder="First Name"
        value={firstName}
        onChangeText={text => setFirstName(text)}
        style={styles.input}
      />
      <TextInput
        placeholder="Last Name"
        value={lastName}
        onChangeText={text => setLastName(text)}
        style={styles.input}
      />
      <TextInput
        placeholder="Date of Birth (YYYY-MM-DD)"
        value={dateOfBirth}
        onChangeText={text => setDateOfBirth(text)}
        style={styles.input}
      />
      <TextInput
        placeholder="Year"
        value={year}
        onChangeText={text => setYear(text)}
        style={styles.input}
      />
      <TextInput
        placeholder="Major"
        value={major}
        onChangeText={text => setMajor(text)}
        style={styles.input}
      />
      <TextInput
        placeholder="Clubs"
        value={clubs}
        onChangeText={text => setClubs(text)}
        style={styles.input}
      />

      <TouchableOpacity onPress={handleSaveInfo} style={styles.button}>
        <Text style={styles.buttonText}>Save Information</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

export default OnboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#0C5449',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
