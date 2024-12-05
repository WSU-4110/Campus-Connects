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
  const [birthdayError, setBirthdayError] = useState(''); // Error state for birthday
  const navigation = useNavigation();

  const validateDate = (date) => {
    const datePattern = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])-(19\d{2}|20[0-1][0-9]|202[0-5])$/;

    if (!datePattern.test(date)) {
      return "Invalid date (MM-DD-YYYY)";
    }
    return null;
  };

  const handleSaveInfo = async () => {
    const error = validateDate(dateOfBirth); // Validate the entered date of birth
    if (error) {
      setBirthdayError(error); // Set error message if validation fails
      return; // Stop saving if there is an error
    }

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

      alert("Information saved. Verify your Email");

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
        placeholder="Date of Birth (DD-MM-YYYY)"
        value={dateOfBirth}
        onChangeText={text => setDateOfBirth(text)}
        style={styles.input}
      />
      {/* Display error message for invalid birthday */}
      {birthdayError ? <Text style={styles.errorText}>{birthdayError}</Text> : null}
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
        <Text style={styles.buttonText}>Save</Text>
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
    fontSize: 30,
    color: '#black',
    fontWeight: 'bold',
    marginBottom: 20,
    fontFamily: 'Montserrat',
  },
  input: {
    width: '100%',
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'white',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#8CAE82',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    fontFamily: 'Montserrat',
    width: '100%',
    
  },
  buttonText: {
    color: 'white',
    fontSize: 19,
    fontFamily: 'Montserrat',
    fontWeight: 'bold',

  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 15,
    fontFamily: 'Montserrat',

  }
});