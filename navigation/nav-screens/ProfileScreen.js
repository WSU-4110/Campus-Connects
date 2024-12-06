import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, KeyboardAvoidingView, TextInput, ScrollView, Modal, Button, Alert } from 'react-native';
import { auth, db, storage } from '../../firebase';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome'; // Import the icon library


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
    email: auth.currentUser?.email,
    dateOfBirth: '',
    year: '',
    major: '',
    clubs: '',
    profilePicture: image10,
  });
  const [editableData, setEditableData] = useState(userData);
  const [isModalVisible, setModalVisible] = useState(false);
  const [profileImageModalVisible, setProfileImageModalVisible] = useState(false);
  const [birthdayError, setBirthdayError] = useState('');


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

  // Function to handle profile image change and update in Firebase
  const handleProfileImageChange = async (image) => {
    setEditableData({ ...editableData, profilePicture: image });
    setProfileImageModalVisible(false);
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      navigation.replace("Login");
    } catch (error) {
      alert(error.message);
    }
  };

  const validateDate = (date) => {
    const datePattern = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])-(19\d{2}|20[0-1][0-9]|202[0-5])$/;

    if (!datePattern.test(date)) {
      return "Invalid date. Please use MM-DD-YYYY.";
    }
    return null;
  };

  const handleSave = async () => {
    if (editableData.dateOfBirth) {
      const validationError = validateDate(editableData.dateOfBirth);
      if (validationError) {
        setBirthdayError(validationError);
        return;
      }
    }
    try {
      const docRef = doc(db, 'profile', auth.currentUser.uid);
      await setDoc(docRef, editableData, { merge: true });
      setUserData(editableData);
      setModalVisible(false);
    } catch (error) {
      alert("Error saving data: " + error.message);
    }
  };

  const handleEditProfile = () => {
    setEditableData(userData);
    setBirthdayError('');
    setModalVisible(true);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Green Design View */}
      <View style={styles.greenDesign}></View>

      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Image */}
      <View>
        <Image source={userData.profilePicture} style={styles.profileImage} />
      </View>

      <Text style={styles.header}>
        {userData.firstName && userData.lastName
          ? `${userData.firstName} ${userData.lastName}`
          : 'Profile Information'}
      </Text>
          
      {/* Profile Information */}
      <View style={styles.infoContainer}>
        <View style={styles.infoBox}>
          <Text style={styles.value}>
            {`Major:  ${userData.major || 'N/A'}`}
          </Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.value}>
            {`Clubs:  ${userData.clubs || 'N/A'}`}
          </Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.value}>
            {`Year:  ${userData.year || 'N/A'}`}
          </Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.value}>
            {`Birthday:  ${userData.dateOfBirth || 'N/A'}`}
          </Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.value}>
            {`Email:  ${userData.email}`}
          </Text>
        </View>
      </View>


      {/* Edit Profile Icon */}
      <TouchableOpacity onPress={handleEditProfile} style={styles.editButton}>
        <Icon name="edit" size={30} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Edit Profile Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView style={styles.modalContainer} behavior="padding">
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Edit Profile</Text>
            <View style={styles.line} /> 

            {/* Editable Profile Image */}
            <TouchableOpacity onPress={() => setProfileImageModalVisible(true)}>
              <Image source={editableData.profilePicture} style={styles.profileImageedit} />
            </TouchableOpacity>

            {/* Edit Other Information */}
            <View style={styles.row}>
            <Text style={styles.label}>First Name:</Text>
            <TextInput
              style={styles.input}
              value={editableData.firstName}
              onChangeText={(text) => setEditableData({ ...editableData, firstName: text })}
            />
            </View>

            <View style={styles.row}>
            <Text style={styles.label}>Last Name:</Text>
            <TextInput
              style={styles.input}
              value={editableData.lastName}
              onChangeText={(text) => setEditableData({ ...editableData, lastName: text })}
            />
            </View>

            <View style={styles.row}>
            <Text style={styles.label}>Major:</Text>
             <TextInput
              style={styles.input}
              value={editableData.major}
              onChangeText={(text) => setEditableData({ ...editableData, major: text })}
            />
            </View>

            <View style={styles.row}>
            <Text style={styles.label}>Clubs:</Text>
            <TextInput
              style={styles.input}
              placeholder="Clubs"
              value={editableData.clubs}
              onChangeText={(text) => setEditableData({ ...editableData, clubs: text })}
            />
            </View>

            <View style={styles.row}>
            <Text style={styles.label}>Year:</Text>
            <TextInput
              style={styles.input}
              placeholder="MM-DD-YYYY"
              value={editableData.year}
              onChangeText={(text) => setEditableData({ ...editableData, year: text })}
            />
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Birthday:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="MM-DD-YYYY"
                  value={editableData.dateOfBirth}
                  onChangeText={(text) => setEditableData({ ...editableData, dateOfBirth: text })}
                />
            </View>
            {birthdayError ? (<Text style={styles.errorText}>{birthdayError}</Text> ) : null}

            <View style={styles.row}>
              <Text style={styles.label}>Email:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={editableData.email}
                  editable={false}
                />
              </View>

              <View style={styles.containe1r}>
      <View style={styles.buttonContainer1}>  {/* Added container for row */}
        {/* Save Button */}
        <TouchableOpacity onPress={handleSave} style={[styles.button1]}>
          <Text style={styles.buttonText1}>Save</Text>
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.button1]}>
          <Text style={styles.buttonText1}>Cancel</Text>
        </TouchableOpacity>
          </View>
            </View>
          </View>
        </KeyboardAvoidingView>
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
            <Text style={styles.modalHeader}>Select a Profile Image</Text>
            <View style={styles.line} /> 
            <View style={styles.imageGrid}>
              {[image1, image2, image3, image4, image5, image6, image7, image8, image9].map((image, index) => (
                <TouchableOpacity key={index} onPress={() => handleProfileImageChange(image)}>
                  <Image source={image} style={styles.gridImage} />
                </TouchableOpacity>
              ))}
            </View>
            <Button title="Close" onPress={() => setProfileImageModalVisible(false)} color="black" />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 20,
  },
  greenDesign: {
    position: 'absolute',
    width: 450,
    height: 240,
    top: -80,
    backgroundColor: '#8CAE82',
    borderRadius: 70,
  },
  headerContainer: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 23,
  },
  signOutButton: {
    position: 'absolute',
    width: 133,  
    height: 40,  // Height of the button
    left: 105,
    top: 630,  // Vertical position
    backgroundColor: '#8CAE82',  // Background color for the button
    borderRadius: 16,  // Rounded corners with 15px radius
    justifyContent: 'center',  
    alignItems: 'center',  
  },
  signOutText: {
    color: '#fff', 
    fontSize: 19,
    fontFamily: 'Montserrat',
  },
  cancelbutton: {
    position: 'absolute',
    width: 133,  
    height: 40,  // Height of the button
    left: 130,  // Horizontal position
    top: 630,  // Vertical position
    backgroundColor: '#8CAE82',  // Background color for the button
    borderRadius: 16,  // Rounded corners with 15px radius
    justifyContent: 'center',  
    alignItems: 'center',  
  },
  savebutton: {
    position: 'absolute',
    width: 133,  
    height: 40,  // Height of the button
    left: 130,  // Horizontal position
    top: 630,  // Vertical position
    backgroundColor: '#8CAE82',  // Background color for the button
    borderRadius: 16,  // Rounded corners with 15px radius
    justifyContent: 'center',  
    alignItems: 'center',  
  },
  buttontext: {
    color: '#fff', 
    fontSize: 19,
    fontFamily: 'Montserrat',
  },

  header: {
    fontSize: 28,
    marginVertical: 5,
    fontFamily: 'Montserrat',
    top: -20,
    color: '#000000',
    marginTop: 14,

  },
  
  profileImage: {
    width: 135,
    height: 135,
    borderRadius: 67.5,
    marginBottom: 15,
    marginTop: 28,
    borderWidth: 2,  // Adds a border with 2px width
    borderColor: '#0C5449', 
  },
  line: {
    borderBottomWidth: 1,   // Adds a thin line
    borderBottomColor: '#ccc',  // Light gray color for the line
    marginBottom: 10,      // Adds some space above and below the line
    width: '100%',            // Optional, adjust width of the line
    alignSelf: 'center',     // Centers the line
  },
  regularText: {
    fontSize: 300,
    fontFamily: 'Montserrat_400Regular', // Reference the font directly in the style
  },
  mediumText: {
    fontSize: 20,
    fontFamily: 'Montserrat_500Medium', // Reference the medium weight font
    marginBottom: 10,
  },
  semiBoldText: {
    fontSize: 30,
    fontFamily: 'Montserrat_600SemiBold', // Reference the semi-bold weight font
    marginBottom: 10,
  },
  profileImageedit: {
    width: 130,
    height: 130,
    borderRadius: 65,
    marginBottom: 20,
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#0C5449',
    alignSelf: 'center',  // Center the image horizontally
  },
  infoContainer: {
    width: '100%',  // Full width of the screen
    marginBottom: 20,
    paddingHorizontal: 10, // Add some horizontal padding
  },

  infoBox: {
    backgroundColor: 'white',
    padding: 19,
    marginBottom: 10,
    borderRadius: 15,
    width: '100%', // Ensure each box stretches across the full width
  },

  value: {
    fontSize: 18,
    fontFamily: 'Montserrat',
    color: '#333',
  },
  
  label: {
    fontSize: 18,
    fontFamily: 'Montserrat',
    marginRight: 10,
  },
  separator: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 10,
  },
  editButton: {
    position: 'absolute',
    left: 31,
    top: 46,
    backgroundColor: 'transparent',
  },
  
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    padding: 18,

  },
  modalContent: {
    width: '98%',
    backgroundColor: '#f2f2f2',
    borderRadius: 15,
    padding: 5,
    elevation: 5,
  },
  modalHeader: {
    fontSize: 27,
    fontWeight: 'semi-bold',
    marginBottom: 8,
    fontFamily: 'Montserrat',
    textAlign: 'center',

  },
  modalInputRow: {
    marginBottom: 15,
  },
  row: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 10,
    borderRadius: 15,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    fontSize: 18,
    fontFamily: 'Montserrat',
  },
  input2: {
    backgroundColor: 'white',
    padding: 19,
    marginBottom: 10,
    borderRadius: 15,
    width: '100%',
    fontSize: 18,
    fontFamily: 'Montserrat',
  },
  
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  
  },
  container1: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    
  },
  buttonContainer1: {
    flexDirection: 'row',  // Aligns buttons in a row
    justifyContent: 'space-between', // Creates space between buttons
    width: '100%', // Full width of the parent container
    maxWidth: 400, // Optional: sets a max width for the button container
  },
  button1: {
    backgroundColor: '#8CAE82',
    paddingVertical: 13,
    paddingHorizontal: 30,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,  // Buttons take equal width
    marginHorizontal: 5,  // Adds horizontal space between buttons
    marginBottom: 20,
  },
  buttonText1: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  gridImage: {
    width: 110,
    height: 110,
    margin: 6,
    borderWidth: 2,
    borderColor: '#0C5449',
  },
 
});

export default ProfileScreen;

