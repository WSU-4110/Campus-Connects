// firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getAuth } from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { getFirestore } from 'firebase/firestore';
import { getReactNativePersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBVnnfrusgUC309qB6v69FmskpivAnj8Sk",
  authDomain: "campusconnects-auth.firebaseapp.com",
  projectId: "campusconnects-auth",
  storageBucket: "campusconnects-auth.appspot.com",
  messagingSenderId: "390104808299",
  appId: "1:390104808299:web:016aad6a18e163f7aeaa2e",
  measurementId: "G-23QWW1CFK3"
};

// Initialize Firebase only if it hasn't been initialized yet
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth only once
const auth = !getAuth().app ? initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
}) : getAuth();

// Initialize Firestore only once
const db = getFirestore(app);

export { app, auth, db };
