import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBVnnfrusgUC309qB6v69FmskpivAnj8Sk",
  authDomain: "campusconnects-auth.firebaseapp.com",
  projectId: "campusconnects-auth",
  storageBucket: "campusconnects-auth.appspot.com",
  messagingSenderId: "390104808299",
  appId: "1:390104808299:web:016aad6a18e163f7aeaa2e",
  measurementId: "G-23QWW1CFK3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

export { app, auth, db };
