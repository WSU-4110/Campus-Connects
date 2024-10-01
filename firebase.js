import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, getReactNativePersistence } from "firebase/auth"; // Import for Firebase Authentication
import AsyncStorage from '@react-native-async-storage/async-storage'; 


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


const auth = getAuth(app); 

export { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword };
