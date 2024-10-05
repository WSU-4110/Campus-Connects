import { KeyboardAvoidingView, StyleSheet, Text, TextInput, TouchableOpacity, View, Image } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        navigation.reset({
          index: 0,
          routes: [{ name: "Home" }],
        });
      }
    });
    return unsubscribe;
  }, [navigation]);
  

  const handleLogin = async () => {
    try {
      const userCredentials = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredentials.user;

      // Check if the email is verified
      await user.reload(); // Reload the user to get updated information
      if (user.emailVerified) {
        // Email is verified, navigate to Home
        navigation.navigate("Home");
      } else {
        // Sign out the user if the email is not verified
        await auth.signOut();
        alert("Please verify your email before logging in.");
      }
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior="padding">
      
      {/* Header Images */}
      <Image 
        source={require('../assets/Rectangle1.png')}
        style={styles.rectangle1}
      />
      <Image 
        source={require('../assets/Rectangle2.png')}
        style={styles.rectangle2}
      />

      {/* Input Container */}
      <View style={styles.inputContainer}>
        <Text style={styles.signInText}>Login</Text>
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={text => setEmail(text)}
          style={styles.input}
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={text => setPassword(text)}
          style={styles.input}
          secureTextEntry
        />
      </View>

      {/* Button Container */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={handleLogin}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <View style={styles.linkContainer}>
          <Text style={styles.linkText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={[styles.linkText, styles.signUpText]}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Image */}
      <Image 
        source={require('../assets/Rectangle3.png')}
        style={styles.rectangle3}
      />
    </KeyboardAvoidingView>
    
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  rectangle1: {
    width: '100%', 
    resizeMode: 'cover', 
  },
  rectangle2: {
    width: '130%', 
    height: 250,  
    resizeMode: 'cover', 
    marginTop: -200,  
  },
  rectangle3: {
    position: 'absolute', 
    bottom: 0,
    width: '100%', 
    resizeMode: 'cover', 
  },
  students:{
    width: 200,
    height:200,

  },
  inputContainer: {
    width: '80%',
    marginTop: 20, 
  },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
    width: '100%',
  },
  buttonContainer: {
    width: '60%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  button: {
    backgroundColor: '#0C5449',
    width: '100%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonOutline: {
    backgroundColor: 'white',
    marginTop: 5,
    borderColor: '#0782F9',
    borderWidth: 2,
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  buttonOutlineText: {
    color: '#0782F9',
    fontWeight: '700',
    fontSize: 16,
  },
  linkContainer: {
    flexDirection: 'row',
    marginTop: 15,
  },
  linkText: {
    color: '#333',
  },
  signUpText: {
    color: '#0C5449',
    fontWeight: 'bold',
  },
  signInText:{
    fontWeight: 'bold',
    fontSize: 36,
    color: '#0C5449',
  }
});
