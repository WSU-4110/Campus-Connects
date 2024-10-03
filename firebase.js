import { initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth"; 
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBVnnfrusgUC309qB6v69FmskpivAnj8Sk",
  authDomain: "campusconnects-auth.firebaseapp.com",
  projectId: "campusconnects-auth",
  storageBucket: "campusconnects-auth.appspot.com",
  messagingSenderId: "390104808299",
  appId: "1:390104808299:web:016aad6a18e163f7aeaa2e",
  measurementId: "G-23QWW1CFK3"
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage) 
});

export { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword };
