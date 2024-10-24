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
import PersonalEventsScreen from './navigation/nav-screens/PersonalEventsScreen';
import CreateEventScreen from './navigation/nav-screens/CreateEventScreen';

import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

const Stack = createNativeStackNavigator();

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (initializing) setInitializing(false);
    });

    return () => unsubscribe();
  }, [initializing]);

  if (initializing) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <Stack.Screen 
            name="Home" 
            component={MainContainer} 
            options={{ headerShown: false }} 
          />
        ) : (
          <>
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
              options={{ headerShown: false }}
              name="SignUp"
              component={SignUpScreen}
            />
          </>
        )}
        <Stack.Screen name="Events" component={EventsScreen} />
        <Stack.Screen name="PersonalEvents" component={PersonalEventsScreen} />
        <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
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
