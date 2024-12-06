import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './screens/LoginScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import SignUpScreen from './screens/SignUpScreen';
import MainContainer from './navigation/MainContainer';
import EventsScreen from './navigation/nav-screens/EventsScreen';
import OnboardScreen from './screens/OnboardScreen';
import PersonalEventsScreen from './navigation/nav-screens/PersonalEventsScreen';
import CreateEventScreen from './navigation/nav-screens/CreateEventScreen';
import BookmarksScreen from './navigation/nav-screens/BookmarksScreen'; 
import EventsScreenAlt from './navigation/nav-screens/EventsScreenAlt';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

import { useFonts } from 'expo-font';
import { Montserrat_400Regular, Montserrat_700Bold } from '@expo-google-fonts/montserrat';

const Stack = createNativeStackNavigator();

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  // Load fonts using useFonts hook
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_700Bold,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (initializing) setInitializing(false);
    });

    return () => unsubscribe();
  }, [initializing]);

  if (initializing || !fontsLoaded) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          options={{ headerShown: false }}
          name="Welcome"
          component={WelcomeScreen}
        />
        <Stack.Screen
          options={{ headerShown: false }}
          name="Login"
          component={LoginScreen}
        />
        <Stack.Screen
          name="Home"
          component={MainContainer}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          options={{ headerShown: false }}
          name="SignUp"
          component={SignUpScreen}
        />
        <Stack.Screen
          options={{ headerShown: false }}
          name="Onboard"
          component={OnboardScreen}
        />
        <Stack.Screen name="Events" component={EventsScreen} 
        options={{
          headerTintColor: '#0C5449', 
          title: '', 
          headerStyle: { backgroundColor: '#E6E5E7' },
          headerBackTitle: 'Back',
        }}  
        />
        <Stack.Screen name="PersonalEvents" component={PersonalEventsScreen} 
        options={{
          headerTintColor: '#0C5449', 
          title: '', 
          headerStyle: { backgroundColor: '#E6E5E7' },
          headerBackTitle: 'Back',
        }}  
        />
        <Stack.Screen name="CreateEvent" component={CreateEventScreen} 
        options={{
          headerTintColor: '#0C5449', 
          title: '', 
          headerStyle: { backgroundColor: '#E6E5E7' },
          headerBackTitle: 'Back',
        }} 
        />
        <Stack.Screen 
        name="Bookmarks" 
        component={BookmarksScreen} 
        options={{
          headerTintColor: '#0C5449', 
          title: '', 
          headerStyle: { backgroundColor: '#E6E5E7' },
          headerBackTitle: 'Back',
        }}  
        
        />
        <Stack.Screen name="EventsScreenAlt" component={EventsScreenAlt}
        options={{headerShown: false}} 
        /> 
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});