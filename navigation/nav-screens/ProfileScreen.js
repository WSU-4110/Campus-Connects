import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, TextInput, ScrollView, Modal, Button } from 'react-native';
import { auth, db } from '../../firebase';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigation } from '@react-navigation/native';

const ProfileScreen = () => {
  const navigation = useNavigation();

  const initialUserData = {
    firstName: '',
    lastName: '',
    email: auth.currentUser?.email || '',
    dateOfBirth: '',
    year: '',
    major: '',
    clubs: '',
  };

  const [userData, setUserData] = useState(initialUserData);
  const [editableData, setEditableData] = useState(initialUserData);
  const [isModalVisible, setModalVisible] = useState(false);

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

      <View style={styles.infoContainer}>
        {Object.keys(initialUserData).map((key, index) => (
          <View key={key}>
            <Text style={styles.value}>{`${key.charAt(0).toUpperCase() + key.slice(1)}: ${userData[key] || 'N/A'}`}</Text>
            {index < Object.keys(initialUserData).length - 1 && <View style={styles.separator} />}
          </View>
        ))}
      </View>

      <TouchableOpacity onPress={() => { setEditableData(userData); setModalVisible(true); }} style={styles.editButton}>
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Edit Profile</Text>
            {Object.keys(initialUserData).map((key) => (
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
    </ScrollView>
  );
};

export default ProfileScreen;

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
});
